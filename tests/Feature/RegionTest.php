<?php

use App\Models\Region;
use App\Models\User;
use Database\Seeders\RegionSeeder;
use Illuminate\Support\Str;

test('regions are seeded without duplicates', function () {
    $this->seed(RegionSeeder::class);
    $this->seed(RegionSeeder::class);

    expect(Region::query()->orderBy('id')->pluck('name')->all())->toBe([
        'Region I',
        'Region II',
        'Region III',
        'Region IV',
    ]);
});

test('a user can belong to a region', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();

    expect(Str::isUlid($region->id))->toBeTrue()
        ->and(Str::isUlid($user->region_id))->toBeTrue()
        ->and($user->region->is($region))->toBeTrue()
        ->and($region->users()->whereKey($user)->exists())->toBeTrue();
});

test('a user region is optional', function () {
    $user = User::factory()->create();

    expect($user->region_id)->toBeNull()
        ->and($user->region)->toBeNull();
});
