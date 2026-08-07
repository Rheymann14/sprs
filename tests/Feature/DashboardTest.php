<?php

use App\Models\Region;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk();
});

test('authenticated users receive their region name', function () {
    $region = Region::factory()->create(['name' => 'Region IV-A']);
    $user = User::factory()->for($region)->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.region.name', 'Region IV-A')
        );
});
