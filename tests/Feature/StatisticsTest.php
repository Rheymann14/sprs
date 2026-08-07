<?php

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
            ->where('statistics.resolved', 0)
            ->where('statistics.pending', 0)
            ->where('statistics.unresolved', 0)
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
