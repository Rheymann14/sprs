<?php

use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

test('a super administrator can be created interactively', function () {
    $this->artisan('make:admin')
        ->expectsQuestion('Name', 'Ada Lovelace')
        ->expectsQuestion('Email', 'ADA@example.com')
        ->expectsQuestion('Password', 'password')
        ->expectsOutput('Super administrator created successfully.')
        ->assertSuccessful();

    $superAdministrator = User::query()
        ->with(['userRole', 'region'])
        ->where('email', 'ada@example.com')
        ->firstOrFail();

    expect($superAdministrator->name)->toBe('Ada Lovelace')
        ->and(Str::isUlid($superAdministrator->user_role_id))->toBeTrue()
        ->and(Str::isUlid($superAdministrator->userRole?->id))->toBeTrue()
        ->and($superAdministrator->isSuperAdmin())->toBeTrue()
        ->and($superAdministrator->region?->name)->toBe(Region::CentralOffice)
        ->and(Hash::check('password', $superAdministrator->password))->toBeTrue()
        ->and(UserRole::query()->where('name', UserRole::SuperAdmin)->count())->toBe(1)
        ->and(Region::query()->where('name', Region::CentralOffice)->count())->toBe(1);
});

test('a super administrator cannot be created with an existing email', function () {
    $superAdministratorRoleCount = UserRole::query()->where('name', UserRole::SuperAdmin)->count();
    $centralOfficeRegionCount = Region::query()->where('name', Region::CentralOffice)->count();

    User::query()->create([
        'name' => 'Existing User',
        'email' => 'ada@example.com',
        'password' => 'password',
    ]);

    $this->artisan('make:admin')
        ->expectsQuestion('Name', 'Ada Lovelace')
        ->expectsQuestion('Email', 'ada@example.com')
        ->expectsQuestion('Password', 'password')
        ->expectsOutput('The email has already been taken.')
        ->assertFailed();

    expect(User::query()->where('email', 'ada@example.com')->count())->toBe(1)
        ->and(UserRole::query()->where('name', UserRole::SuperAdmin)->count())->toBe($superAdministratorRoleCount)
        ->and(Region::query()->where('name', Region::CentralOffice)->count())->toBe($centralOfficeRegionCount);
});
