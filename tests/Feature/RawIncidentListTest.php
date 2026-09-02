<?php

use App\Models\Incident;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

test('guests are redirected from the raw incident list', function () {
    $this->get(route('raw-list.index'))->assertRedirect(route('login'));
    $this->get(route('raw-list.export'))->assertRedirect(route('login'));
});

test('raw incident list is region scoped and can be filtered', function () {
    $region = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $type = IncidentType::factory()->for($region)->create(['name' => 'Safety']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create(['name' => 'Laboratory']);
    $otherType = IncidentType::factory()->for($region)->create(['name' => 'Health']);
    $otherSubcategory = IncidentSubcategory::factory()->for($otherType)->create(['name' => 'Medical']);

    $matchingIncident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create(['created_at' => '2026-06-15 08:00:00']);
    Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create(['created_at' => '2026-05-31 08:00:00']);
    Incident::factory()
        ->for($region)
        ->for($otherSubcategory, 'subcategory')
        ->create(['created_at' => '2026-06-15 08:00:00']);
    Incident::factory()
        ->for($otherRegion)
        ->for($subcategory, 'subcategory')
        ->create(['created_at' => '2026-06-15 08:00:00']);

    $this->actingAs($user)
        ->get(route('raw-list.index', [
            'date_from' => '2026-06-01',
            'date_to' => '2026-06-30',
            'incident_type_id' => $type->id,
            'subcategory_id' => $subcategory->id,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('raw-list/index')
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $matchingIncident->id)
            ->where('incidents.data.0.incident_type', 'Safety')
            ->where('incidents.data.0.subcategory', 'Laboratory')
            ->where('filters.date_from', '2026-06-01')
            ->where('filters.date_to', '2026-06-30')
            ->where('filters.incident_type_id', $type->id)
            ->where('filters.subcategory_id', $subcategory->id)
            ->has('incidentTypes', 2)
        );
});

test('raw incident rows show the saved form answers', function () {
    Storage::fake('public');
    $uploadedImage = UploadedFile::fake()->image('laboratory.jpg');
    $uploadedImagePath = $uploadedImage->storeAs('incident-reports', 'laboratory.jpg', 'public');
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $otherUser = User::factory()->for(Region::factory())->create();
    $type = IncidentType::factory()->for($region)->create(['name' => 'Safety']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create(['name' => 'Laboratory']);
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'report_data' => [
                'title' => 'Safety report',
                'description' => 'Initial submission',
                'sections' => [[
                    'title' => 'Incident details',
                    'description' => 'Submitted answers',
                    'fields' => [
                        ['label' => 'Location', 'type' => 'text', 'value' => 'Science laboratory'],
                        ['label' => 'Emergency response', 'type' => 'checkbox', 'value' => true],
                        [
                            'label' => 'Scene photo',
                            'type' => 'file',
                            'value' => [
                                'name' => 'laboratory.jpg',
                                'path' => $uploadedImagePath,
                            ],
                        ],
                    ],
                ]],
            ],
        ]);

    $this->actingAs($user)
        ->get(route('raw-list.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('raw-list/index')
            ->where('incidents.data.0.id', $incident->id)
            ->where('incidents.data.0.answers.0.label', 'Location')
            ->where('incidents.data.0.answers.0.value', 'Science laboratory')
            ->where('incidents.data.0.answers.1.label', 'Emergency response')
            ->where('incidents.data.0.answers.1.value', 'Yes')
            ->where('incidents.data.0.answers.2.label', 'Scene photo')
            ->where('incidents.data.0.answers.2.value', 'laboratory.jpg')
            ->where('incidents.data.0.answers.2.attachment.name', 'laboratory.jpg')
            ->where('incidents.data.0.answers.2.attachment.url', Storage::disk('public')->url($uploadedImagePath))
            ->where('incidents.data.0.answers.2.attachment.mime_type', 'image/jpeg')
        );

    $this->actingAs($otherUser)
        ->get(route('raw-list.index'))
        ->assertInertia(fn (Assert $page) => $page->where('incidents.total', 0));
});

test('routed incidents appear in the raw list for the destination region', function () {
    $originRegion = Region::factory()->create();
    $destinationRegion = Region::factory()->create();
    $user = User::factory()->for($destinationRegion)->create();
    $incident = Incident::factory()->for($originRegion)->create();
    $incident->routedRegions()->attach($destinationRegion);

    $this->actingAs($user)
        ->get(route('raw-list.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $incident->id)
        );
});

test('raw incident list rejects an inverted date range', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('raw-list.index', [
            'date_from' => '2026-06-30',
            'date_to' => '2026-06-01',
        ]))
        ->assertSessionHasErrors('date_to');
});

test('raw incidents export to a styled and sorted xlsx workbook', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $type = IncidentType::factory()->for($region)->create(['name' => 'Safety']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create(['name' => 'Laboratory']);
    $reportData = [
        'sections' => [[
            'fields' => [
                ['label' => 'Location', 'type' => 'text', 'value' => 'Science laboratory'],
            ],
        ]],
    ];

    Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'incident_number' => '2026-SAFETY-ZZZZ',
            'report_data' => $reportData,
        ]);
    Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'incident_number' => '2026-SAFETY-AAAA',
            'report_data' => $reportData,
        ]);
    Incident::factory()->for(Region::factory())->create([
        'incident_number' => '2026-HIDDEN-0000',
    ]);

    $response = $this->actingAs($user)->get(route('raw-list.export', [
        'incident_type_id' => $type->id,
        'subcategory_id' => $subcategory->id,
        'sort_by' => 'incident_number',
        'sort_direction' => 'asc',
    ]));

    $response
        ->assertSuccessful()
        ->assertDownload('raw-incidents-'.now()->toDateString().'.xlsx')
        ->assertHeader(
            'content-type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );

    $workbookPath = tempnam(sys_get_temp_dir(), 'raw-incidents-test-');
    file_put_contents($workbookPath, $response->streamedContent());

    try {
        $spreadsheet = IOFactory::load($workbookPath);
        $worksheet = $spreadsheet->getActiveSheet();

        expect($worksheet->getCell('A1')->getValue())->toBe('Date Filed')
            ->and($worksheet->getCell('B2')->getValue())->toBe('2026-SAFETY-AAAA')
            ->and($worksheet->getCell('B3')->getValue())->toBe('2026-SAFETY-ZZZZ')
            ->and($worksheet->getCell('G2')->getValue())->toBe('Location: Science laboratory')
            ->and($worksheet->getHighestRow())->toBe(3)
            ->and($worksheet->getAutoFilter()->getRange())->toBe('A1:G3')
            ->and($worksheet->getFreezePane())->toBe('A2')
            ->and($worksheet->getStyle('A1')->getFill()->getFillType())->toBe(Fill::FILL_SOLID)
            ->and($worksheet->getStyle('A1')->getFill()->getStartColor()->getRGB())->toBe('2563EB')
            ->and($worksheet->getStyle('A1')->getBorders()->getBottom()->getBorderStyle())
            ->toBe(Border::BORDER_THIN);

        $spreadsheet->disconnectWorksheets();
    } finally {
        unlink($workbookPath);
    }
});
