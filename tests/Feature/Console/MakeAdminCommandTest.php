<?php

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

test('an administrator can be created interactively', function () {
    UserRole::query()->create(['name' => UserRole::Administrator]);

    $this->artisan('make:admin')
        ->expectsQuestion('Name', 'Ada Lovelace')
        ->expectsQuestion('Email', 'ADA@example.com')
        ->expectsQuestion('Password', 'password')
        ->expectsOutput('Administrator created successfully.')
        ->assertSuccessful();

    $administrator = User::query()
        ->with('userRole')
        ->where('email', 'ada@example.com')
        ->firstOrFail();

    expect($administrator->name)->toBe('Ada Lovelace')
        ->and(Str::isUlid($administrator->user_role_id))->toBeTrue()
        ->and(Str::isUlid($administrator->userRole?->id))->toBeTrue()
        ->and($administrator->userRole?->name)->toBe(UserRole::Administrator)
        ->and(Hash::check('password', $administrator->password))->toBeTrue()
        ->and(UserRole::query()->where('name', UserRole::Administrator)->count())->toBe(1);
});

test('an administrator cannot be created with an existing email', function () {
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
        ->and(UserRole::query()->where('name', UserRole::Administrator)->doesntExist())->toBeTrue();
});
