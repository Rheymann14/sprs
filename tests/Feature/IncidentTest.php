<?php

use App\Enums\FormFieldType;
use App\Enums\IncidentStatusIcon;
use App\Models\FormField;
use App\Models\FormFieldOption;
use App\Models\FormSection;
use App\Models\Incident;
use App\Models\IncidentForm;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from incidents', function () {
    $this->get(route('incidents.index'))->assertRedirect(route('login'));
});

test('authenticated users can view incidents from their region', function () {
    $region = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $type = IncidentType::factory()->create(['name' => 'HAZING']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create([
        'name' => 'Physical hazing',
    ]);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Under review',
        'icon' => IncidentStatusIcon::Clock,
        'sort_order' => 0,
    ]);
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'incident_number' => '2026-HAZING-1A34',
            'status' => 'Under review',
        ]);
    Incident::factory()
        ->for($otherRegion)
        ->for($subcategory, 'subcategory')
        ->create();

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/index')
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $incident->id)
            ->where('incidents.data.0.incident_number', '2026-HAZING-1A34')
            ->where('incidents.data.0.incident_type', 'HAZING')
            ->where('incidents.data.0.subcategory', 'Physical hazing')
            ->where('incidents.data.0.status_label', 'Under review')
            ->where('incidents.data.0.status_icon', IncidentStatusIcon::Clock->value)
        );
});

test('incidents can be searched and paginated', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $type = IncidentType::factory()->create(['name' => 'HAZING']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create([
        'name' => 'Physical hazing',
    ]);

    Incident::factory()
        ->count(11)
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create();

    $target = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create(['incident_number' => '2026-HAZING-1A34']);

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('incidents.data', 10)
            ->where('incidents.total', 12)
            ->where('incidents.last_page', 2)
        );

    $this->actingAs($user)
        ->get(route('incidents.index', ['search' => '1A34']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.search', '1A34')
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $target->id)
        );
});

test('incident numbers use the creation year type and a four character suffix', function () {
    $this->travelTo('2026-08-07 12:00:00');
    $type = IncidentType::factory()->create(['name' => 'Hazing']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create();

    $incident = Incident::factory()
        ->for($subcategory, 'subcategory')
        ->create();

    expect($incident->incident_number)->toMatch('/^2026-HAZING-[A-Z0-9]{4}$/');
});

test('users see report forms saved for their region', function () {
    $region = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $type = IncidentType::factory()->create(['name' => 'Fire']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create(['name' => 'Structural fire']);
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create(['title' => 'Fire report']);
    IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($otherRegion)
        ->create(['title' => 'Other region report']);

    $section = FormSection::factory()->for($form, 'form')->create(['title' => 'Location']);
    FormField::factory()->for($section, 'section')->create(['label' => 'Address']);

    $this->actingAs($user)
        ->get(route('incidents.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/create')
            ->has('incidentTypes', 1)
            ->where('incidentTypes.0.name', 'Fire')
            ->where('incidentTypes.0.subcategories.0.name', 'Structural fire')
            ->where('incidentTypes.0.subcategories.0.forms.0.title', 'Fire report')
            ->where('incidentTypes.0.subcategories.0.forms.0.sections.0.title', 'Location')
            ->missing('incidentTypes.0.subcategories.0.forms.1')
        );
});

test('users can submit a regional incident report', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $type = IncidentType::factory()->create(['name' => 'Medical']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create(['name' => 'Emergency']);
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create(['title' => 'Medical assessment']);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Awaiting response',
        'icon' => IncidentStatusIcon::Clock,
        'sort_order' => 0,
    ]);
    $section = FormSection::factory()->for($form, 'form')->create(['title' => 'Patient']);
    $textField = FormField::factory()->for($section, 'section')->create([
        'label' => 'Patient name',
        'is_required' => true,
        'sort_order' => 0,
    ]);
    $dropdown = FormField::factory()->for($section, 'section')->create([
        'type' => FormFieldType::Dropdown,
        'label' => 'Severity',
        'is_required' => true,
        'sort_order' => 1,
    ]);
    $option = FormFieldOption::factory()->for($dropdown, 'field')->create([
        'label' => 'Critical',
        'value' => 'critical',
    ]);

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'incident_subcategory_id' => $subcategory->id,
            'responses' => [
                $textField->id => 'Juan Dela Cruz',
                $dropdown->id => $option->value,
            ],
        ])
        ->assertRedirect(route('incidents.index'))
        ->assertInertiaFlash('toast.type', 'success')
        ->assertInertiaFlash('toast.message', 'Incident report filed.');

    $incident = Incident::query()->firstOrFail();

    expect($incident->region_id)->toBe($region->id)
        ->and($incident->incident_subcategory_id)->toBe($subcategory->id)
        ->and($incident->status)->toBe('Awaiting response')
        ->and($incident->report_data['title'])->toBe('Medical assessment')
        ->and($incident->report_data['sections'][0]['fields'][0]['value'])->toBe('Juan Dela Cruz')
        ->and($incident->report_data['sections'][0]['fields'][1]['display_value'])->toBe('Critical');

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $incident->id)
            ->where('incidents.data.0.incident_type', 'Medical')
            ->where('incidents.data.0.subcategory', 'Emergency')
        );
});

test('users cannot submit another regions report form', function () {
    $userRegion = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = User::factory()->for($userRegion)->create();
    $subcategory = IncidentSubcategory::factory()->create();
    IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($otherRegion)
        ->create();

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'incident_subcategory_id' => $subcategory->id,
            'responses' => [],
        ])
        ->assertSessionHasErrors('incident_subcategory_id');

    expect(Incident::query()->doesntExist())->toBeTrue();
});

test('required report fields are validated', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $subcategory = IncidentSubcategory::factory()->create();
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create();
    $section = FormSection::factory()->for($form, 'form')->create();
    $field = FormField::factory()->for($section, 'section')->create([
        'label' => 'Location',
        'is_required' => true,
    ]);

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'incident_subcategory_id' => $subcategory->id,
            'responses' => [],
        ])
        ->assertSessionHasErrors("responses.{$field->id}");

    expect(Incident::query()->doesntExist())->toBeTrue();
});

test('users can edit incident report details without changing status', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $subcategory = IncidentSubcategory::factory()->create();
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Closed',
        'icon' => IncidentStatusIcon::CircleCheck,
        'sort_order' => 0,
    ]);
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create(['title' => 'Incident details']);
    $section = FormSection::factory()->for($form, 'form')->create([
        'title' => 'Details',
    ]);
    $field = FormField::factory()->for($section, 'section')->create([
        'label' => 'Location',
        'is_required' => true,
    ]);
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'status' => 'Closed',
            'report_data' => [
                'title' => 'Incident details',
                'sections' => [
                    [
                        'title' => 'Details',
                        'fields' => [
                            [
                                'field_id' => $field->id,
                                'label' => 'Location',
                                'type' => FormFieldType::Text->value,
                                'value' => 'Old location',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

    $this->actingAs($user)
        ->get(route('incidents.edit', $incident))
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/create')
            ->where('incident.id', $incident->id)
            ->where('incident.incident_type_id', $subcategory->incident_type_id)
            ->where('incident.incident_subcategory_id', $subcategory->id)
            ->where("incident.responses.{$field->id}", 'Old location')
        );

    $this->actingAs($user)
        ->from(route('incidents.index'))
        ->put(route('incidents.update', $incident), [
            'incident_subcategory_id' => $subcategory->id,
            'status' => 'Not configured',
            'responses' => [
                $field->id => 'Updated location',
            ],
        ])
        ->assertRedirect(route('incidents.index'))
        ->assertInertiaFlash('toast.message', 'Incident updated.');

    expect($incident->refresh()->status)->toBe('Closed')
        ->and($incident->report_data['sections'][0]['fields'][0]['value'])->toBe('Updated location');

    $this->actingAs($user)
        ->put(route('incidents.update', $incident), [
            'incident_subcategory_id' => IncidentSubcategory::factory()->create()->id,
            'responses' => [$field->id => 'Updated location'],
        ])
        ->assertSessionHasErrors('incident_subcategory_id');
});

test('users cannot update or delete incidents from another region', function () {
    $user = User::factory()->for(Region::factory())->create();
    $incident = Incident::factory()->for(Region::factory())->create();

    $this->actingAs($user)
        ->get(route('incidents.edit', $incident))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('incidents.update', $incident), ['status' => 'Pending'])
        ->assertForbidden();

    $this->actingAs($user)
        ->delete(route('incidents.destroy', $incident))
        ->assertForbidden();

    $this->assertModelExists($incident);
});

test('users can delete regional incidents and their attachments', function () {
    Storage::fake('local');
    Storage::disk('local')->put('incident-reports/evidence.pdf', 'evidence');

    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $incident = Incident::factory()->for($region)->create([
        'report_data' => [
            'sections' => [
                [
                    'fields' => [
                        [
                            'type' => FormFieldType::File->value,
                            'value' => [
                                'name' => 'evidence.pdf',
                                'path' => 'incident-reports/evidence.pdf',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ]);

    $this->actingAs($user)
        ->from(route('incidents.index'))
        ->delete(route('incidents.destroy', $incident))
        ->assertRedirect(route('incidents.index'))
        ->assertInertiaFlash('toast.message', 'Incident deleted.');

    $this->assertModelMissing($incident);
    Storage::disk('local')->assertMissing('incident-reports/evidence.pdf');
});
