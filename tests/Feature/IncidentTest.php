<?php

use App\Models\Incident;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
use App\Models\User;
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
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'incident_number' => '2026-HAZING-1A34',
            'status' => 'pending',
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
            ->where('incidents.data.0.status_label', 'Pending')
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
