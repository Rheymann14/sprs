<?php

use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

function userManager(string $roleName = UserRole::SuperAdmin): User
{
    $role = UserRole::query()->create(['name' => $roleName]);

    return User::factory()->for($role, 'userRole')->create();
}

test('guests are redirected from user management', function () {
    $this->get(route('user-management.index'))->assertRedirect(route('login'));
});

test('unauthorized users cannot manage users', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('user-management.index'))
        ->assertForbidden();
});

test('user managers can view users, role groups and regions', function () {
    $region = Region::factory()->create(['name' => 'Region IV-A']);

    $this->actingAs(userManager())
        ->get(route('user-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('user-management/index')
            ->has('users.data', 1)
            ->where('users.total', 1)
            ->where('users.data.0.can_delete', false)
            ->where('roleGroups.0.label', 'CHED Central Office')
            ->where('roleGroups.0.options.0.label', 'Super Admin')
            ->where('roleGroups.1.label', 'CHED Regional Office')
            ->where('roleGroups.2.options.0.label', 'Agency')
            ->where('regions.0.id', $region->id)
            ->where('regions.0.name', 'Region IV-A')
        );
});

test('users can be searched and paginated', function () {
    $manager = userManager();
    $role = UserRole::query()->create(['name' => UserRole::RegionalOfficeStaff]);
    $region = Region::factory()->create(['name' => 'Region VII']);

    User::factory()
        ->count(11)
        ->for($role, 'userRole')
        ->for($region)
        ->create();

    User::factory()
        ->for($role, 'userRole')
        ->for($region)
        ->create([
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
        ]);

    $this->actingAs($manager)
        ->get(route('user-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('users.data', 10)
            ->where('users.total', 13)
            ->where('users.last_page', 2)
        );

    $this->actingAs($manager)
        ->get(route('user-management.index', ['search' => 'ada']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.search', 'ada')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Ada Lovelace')
            ->where('users.data.0.email', 'ada@example.com')
            ->where('users.data.0.role', 'RO Staff')
            ->where('users.data.0.region', 'Region VII')
        );

    $this->actingAs($manager)
        ->get(route('user-management.index', ['search' => 'RO Staff']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.search', 'RO Staff')
            ->where('users.total', 12)
            ->where('users.data.0.role', 'RO Staff')
        );
});

test('user managers can create a regionally assigned user', function () {
    $region = Region::factory()->create();

    $this->actingAs(userManager(UserRole::CentralOfficeAdministrator))
        ->post(route('user-management.store'), [
            'name' => '  Juan   Dela Cruz  ',
            'email' => 'JUAN@EXAMPLE.COM',
            'password' => 'chedsprs2026',
            'user_role' => UserRole::RegionalOfficeStaff,
            'region_id' => $region->id,
        ])
        ->assertRedirect(route('user-management.index'))
        ->assertInertiaFlash('toast.type', 'success')
        ->assertInertiaFlash('toast.message', 'User created.');

    $user = User::query()
        ->with(['userRole', 'region'])
        ->where('email', 'juan@example.com')
        ->firstOrFail();

    expect($user->name)->toBe('Juan Dela Cruz')
        ->and($user->userRole?->name)->toBe(UserRole::RegionalOfficeStaff)
        ->and($user->region?->is($region))->toBeTrue()
        ->and(Hash::check('chedsprs2026', $user->password))->toBeTrue()
        ->and($user->password)->not->toBe('chedsprs2026');
});

test('user creation validates unique email role and region', function () {
    $existingUser = User::factory()->create();

    $this->actingAs(userManager())
        ->post(route('user-management.store'), [
            'name' => 'New User',
            'email' => $existingUser->email,
            'password' => 'short',
            'user_role' => 'unknown-role',
            'region_id' => '01INVALIDREGIONIDENTIFIER0',
        ])
        ->assertSessionHasErrors([
            'email',
            'password',
            'user_role',
            'region_id',
        ]);
});

test('user managers can update a user', function () {
    $manager = userManager();
    $originalRole = UserRole::query()->create(['name' => UserRole::CentralOfficeStaff]);
    $targetUser = User::factory()->for($originalRole, 'userRole')->create();
    $region = Region::factory()->create();

    $this->actingAs($manager)
        ->put(route('user-management.update', $targetUser), [
            'name' => '  Updated   User  ',
            'email' => 'UPDATED@EXAMPLE.COM',
            'password' => 'updatedpassword',
            'user_role' => UserRole::Agency,
            'region_id' => $region->id,
        ])
        ->assertRedirect(route('user-management.index'))
        ->assertInertiaFlash('toast.message', 'User updated.');

    $targetUser->refresh()->load(['userRole', 'region']);

    expect($targetUser->name)->toBe('Updated User')
        ->and($targetUser->email)->toBe('updated@example.com')
        ->and($targetUser->userRole?->name)->toBe(UserRole::Agency)
        ->and($targetUser->region?->is($region))->toBeTrue()
        ->and(Hash::check('updatedpassword', $targetUser->password))->toBeTrue();
});

test('user managers can delete another user but not themselves', function () {
    $manager = userManager();
    $targetUser = User::factory()->create();

    $this->actingAs($manager)
        ->delete(route('user-management.destroy', $targetUser))
        ->assertRedirect(route('user-management.index'))
        ->assertInertiaFlash('toast.message', 'User deleted.');

    $this->assertModelMissing($targetUser);

    $this->actingAs($manager)
        ->delete(route('user-management.destroy', $manager))
        ->assertForbidden();

    $this->assertModelExists($manager);
});
