<?php

use App\Models\Incident;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the raw incident list', function () {
    $this->get(route('raw-list.index'))->assertRedirect(route('login'));
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

test('raw incident details show the saved form answers', function () {
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
                    ],
                ]],
            ],
        ]);

    $this->actingAs($user)
        ->get(route('raw-list.show', $incident))
        ->assertInertia(fn (Assert $page) => $page
            ->component('raw-list/show')
            ->where('incident.id', $incident->id)
            ->where('incident.report_title', 'Safety report')
            ->where('incident.report_description', 'Initial submission')
            ->where('incident.report_sections.0.title', 'Incident details')
            ->where('incident.report_sections.0.fields.0.label', 'Location')
            ->where('incident.report_sections.0.fields.0.value', 'Science laboratory')
            ->where('incident.report_sections.0.fields.1.value', 'Yes')
        );

    $this->actingAs($otherUser)
        ->get(route('raw-list.show', $incident))
        ->assertForbidden();
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
