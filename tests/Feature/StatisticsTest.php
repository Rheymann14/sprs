<?php

use App\Enums\IncidentStatusIcon;
use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('statistics'))->assertRedirect(route('login'));
});

test('authenticated users can visit the statistics page', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('statistics'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('statistics')
            ->where('statistics.total', 0)
            ->where('statistics.status_counts', [])
            ->where('statistics.rows', [])
        );
});

test('statistics group regional incident reports by year type and subcategory', function () {
    $region = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $incidentType = IncidentType::factory()->create(['name' => 'Child Protection']);
    $subcategory = IncidentSubcategory::factory()->for($incidentType)->create([
        'name' => 'Bullying',
    ]);

    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Monitoring',
        'icon' => IncidentStatusIcon::Clock,
        'sort_order' => 0,
    ]);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Closed',
        'icon' => IncidentStatusIcon::CircleCheck,
        'sort_order' => 1,
    ]);

    Incident::factory()->for($region)->for($subcategory, 'subcategory')->create([
        'status' => 'Monitoring',
        'created_at' => '2025-02-01 08:00:00',
    ]);
    Incident::factory()->for($region)->for($subcategory, 'subcategory')->create([
        'status' => 'Closed',
        'created_at' => '2025-05-01 08:00:00',
    ]);
    Incident::factory()->for($region)->for($subcategory, 'subcategory')->create([
        'status' => 'Monitoring',
        'created_at' => '2024-05-01 08:00:00',
    ]);
    Incident::factory()->for($otherRegion)->for($subcategory, 'subcategory')->create([
        'status' => 'Closed',
        'created_at' => '2025-05-01 08:00:00',
    ]);

    $this->actingAs($user)
        ->get(route('statistics'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('statistics.total', 3)
            ->where('statistics.status_counts.0.name', 'Monitoring')
            ->where('statistics.status_counts.0.count', 2)
            ->where('statistics.status_counts.1.name', 'Closed')
            ->where('statistics.status_counts.1.count', 1)
            ->where('statistics.rows.0.year', 2025)
            ->where('statistics.rows.0.incident_type_id', $incidentType->id)
            ->where('statistics.rows.0.incident_type', 'Child Protection')
            ->where('statistics.rows.0.subcategory_id', $subcategory->id)
            ->where('statistics.rows.0.subcategory', 'Bullying')
            ->where('statistics.rows.0.total', 2)
            ->where('statistics.rows.0.status_counts.0.name', 'Monitoring')
            ->where('statistics.rows.0.status_counts.0.count', 1)
            ->where('statistics.rows.0.status_counts.1.name', 'Closed')
            ->where('statistics.rows.0.status_counts.1.count', 1)
            ->where('statistics.rows.1.year', 2024)
            ->where('statistics.rows.1.total', 1)
            ->where('statistics.rows.1.status_counts.0.count', 1)
            ->where('statistics.rows.1.status_counts.1.count', 0)
        );
});

test('authenticated users receive their region name', function () {
    $region = Region::factory()->create(['name' => 'Region IV-A']);
    $user = User::factory()->for($region)->create();

    $this->actingAs($user)
        ->get(route('statistics'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.region.name', 'Region IV-A')
        );
});
