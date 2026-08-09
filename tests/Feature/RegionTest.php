<?php

use App\Models\Region;
use App\Models\User;
use Database\Seeders\RegionSeeder;
use Illuminate\Support\Str;

test('regions are seeded without duplicates', function () {
    $this->seed(RegionSeeder::class);
    $this->seed(RegionSeeder::class);

    expect(Region::query()->orderBy('id')->pluck('name')->all())->toBe([
        'CHED Central Office',
        'Regional Office I',
        'Regional Office II',
        'Regional Office III',
        'Regional Office IV',
        'Regional Office V',
        'Regional Office VI',
        'Regional Office VII',
        'Regional Office VIII',
        'Regional Office IX',
        'Regional Office X',
        'Regional Office XI',
        'Regional Office XII',
        'Regional Office CAR',
        'Regional Office CARAGA',
        'Regional Office MIMAROPA',
        'Regional Office NCR',
        'Regional Office NIR',
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
