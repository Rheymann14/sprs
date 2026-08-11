<?php

use App\Enums\UserRoleGroup;
use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

function userManager(string $roleName = UserRole::SuperAdmin, ?Region $region = null): User
{
    $role = UserRole::query()->create(['name' => $roleName]);
    $region ??= in_array($roleName, [
        UserRole::Administrator,
        UserRole::SuperAdmin,
        UserRole::CentralOfficeAdministrator,
        UserRole::CentralOfficeStaff,
    ], true)
        ? Region::query()->firstOrCreate(['name' => Region::CentralOffice])
        : Region::factory()->create();

    return User::factory()->for($role, 'userRole')->for($region)->create();
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

    $this->actingAs(userManager(region: $region))
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
            ->where('roleGroupOptions.0.value', UserRoleGroup::CentralOffice->value)
            ->where('roleGroupOptions.1.value', UserRoleGroup::RegionalOffice->value)
            ->where('roleGroupOptions.2.value', UserRoleGroup::Agency->value)
            ->where('canManageRoles', true)
            ->where('canManageRegions', true)
            ->has('roles.data', 1)
            ->where('roles.data.0.name', 'Super Admin')
            ->where('roles.data.0.group', 'CHED Central Office')
            ->where('roles.data.0.users_count', 1)
            ->where('roles.data.0.can_delete', false)
            ->where('regions.1.id', $region->id)
            ->where('regions.1.name', 'Region IV-A')
            ->where('regions.1.users_count', 1)
            ->has('managedRegions.data', 2)
            ->where('managedRegions.data.1.name', 'Region IV-A')
        );
});

test('office administrators can manage roles but only super admins can manage regions', function () {
    $manager = userManager(UserRole::CentralOfficeAdministrator);

    $this->actingAs($manager)
        ->get(route('user-management.index', ['tab' => 'roles']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('canManageRoles', true)
            ->where('canManageRegions', false)
            ->where('filters.tab', 'roles')
            ->where('roles.total', 1)
            ->where('managedRegions', null)
        );

    $this->actingAs($manager)
        ->post(route('user-management.roles.store'), [
            'display_name' => 'Data Officer',
            'organization_group' => UserRoleGroup::CentralOffice->value,
        ])
        ->assertRedirect(route('user-management.index', ['tab' => 'roles']));

    $this->actingAs($manager)
        ->post(route('user-management.roles.store'), [
            'display_name' => 'Regional Data Officer',
            'organization_group' => UserRoleGroup::RegionalOffice->value,
        ])
        ->assertSessionHasErrors('organization_group');

    $this->actingAs($manager)
        ->post(route('user-management.regions.store'), ['name' => 'Region Test'])
        ->assertForbidden();
});

test('super admins can search and paginate roles and regions independently', function () {
    $manager = userManager();

    foreach (range(1, 12) as $index) {
        UserRole::query()->create(['name' => "custom-role-{$index}"]);
        Region::factory()->create(['name' => "Test Region {$index}"]);
    }

    $this->actingAs($manager)
        ->get(route('user-management.index', ['tab' => 'roles', 'roles_page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.tab', 'roles')
            ->where('roles.current_page', 2)
            ->where('roles.total', 13)
            ->has('roles.data', 3)
        );

    $this->actingAs($manager)
        ->get(route('user-management.index', ['tab' => 'roles', 'role_search' => 'Custom Role 12']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.role_search', 'Custom Role 12')
            ->where('roles.total', 1)
            ->where('roles.data.0.name', 'Custom Role 12')
        );

    $this->actingAs($manager)
        ->get(route('user-management.index', ['tab' => 'regions', 'region_search' => 'Test Region 12']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.region_search', 'Test Region 12')
            ->where('managedRegions.total', 1)
            ->where('managedRegions.data.0.name', 'Test Region 12')
        );
});

test('super admins can create edit and delete custom roles', function () {
    $manager = userManager();

    $this->actingAs($manager)
        ->post(route('user-management.roles.store'), [
            'display_name' => 'Data Officer',
            'organization_group' => UserRoleGroup::CentralOffice->value,
        ])
        ->assertRedirect(route('user-management.index', ['tab' => 'roles']))
        ->assertInertiaFlash('toast.message', 'Role created.');

    $role = UserRole::query()->where('name', 'data-officer')->firstOrFail();

    expect($role)
        ->display_name->toBe('Data Officer')
        ->organization_group->toBe(UserRoleGroup::CentralOffice)
        ->is_system->toBeFalse();

    $this->actingAs($manager)
        ->get(route('user-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('roleGroups.0.options.3.value', 'data-officer')
            ->where('roleGroups.0.options.3.label', 'Data Officer')
        );

    $this->actingAs($manager)
        ->put(route('user-management.roles.update', $role), [
            'display_name' => 'Senior Data Officer',
            'organization_group' => UserRoleGroup::RegionalOffice->value,
        ])
        ->assertRedirect(route('user-management.index', ['tab' => 'roles']))
        ->assertInertiaFlash('toast.message', 'Role updated.');

    $role->refresh();

    expect($role)
        ->name->toBe('data-officer')
        ->display_name->toBe('Senior Data Officer')
        ->organization_group->toBe(UserRoleGroup::RegionalOffice);

    $this->actingAs($manager)
        ->get(route('user-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('roleGroups.1.options.2.value', 'data-officer')
            ->where('roleGroups.1.options.2.label', 'Senior Data Officer')
        );

    $this->actingAs($manager)
        ->delete(route('user-management.roles.destroy', $role))
        ->assertRedirect(route('user-management.index', ['tab' => 'roles']))
        ->assertInertiaFlash('toast.message', 'Role deleted.');

    $this->assertModelMissing($role);
});

test('built-in and assigned roles cannot be deleted', function () {
    $manager = userManager();
    $assignedRole = UserRole::query()->create(['name' => 'assigned-custom-role']);
    User::factory()->for($assignedRole, 'userRole')->for($manager->region)->create();

    $this->actingAs($manager)
        ->delete(route('user-management.roles.destroy', $manager->userRole))
        ->assertSessionHasErrors('role');

    $this->actingAs($manager)
        ->delete(route('user-management.roles.destroy', $assignedRole))
        ->assertSessionHasErrors('role');

    $this->assertModelExists($manager->userRole);
    $this->assertModelExists($assignedRole);
});

test('built-in roles cannot be edited', function () {
    $manager = userManager();

    $this->actingAs($manager)
        ->put(route('user-management.roles.update', $manager->userRole), [
            'display_name' => 'Renamed Super Admin',
            'organization_group' => UserRoleGroup::Agency->value,
        ])
        ->assertForbidden();

    expect($manager->userRole->refresh())
        ->display_name->toBe('Super Admin')
        ->organization_group->toBe(UserRoleGroup::CentralOffice);
});

test('super admins can create and safely delete regions', function () {
    $managerRegion = Region::factory()->create();
    $manager = userManager(region: $managerRegion);
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);

    $this->actingAs($manager)
        ->post(route('user-management.regions.store'), ['name' => '  Region   Test  '])
        ->assertRedirect(route('user-management.index', ['tab' => 'regions']))
        ->assertInertiaFlash('toast.message', 'Region created.');

    $region = Region::query()->where('name', 'Region Test')->firstOrFail();

    $this->actingAs($manager)
        ->delete(route('user-management.regions.destroy', $region))
        ->assertRedirect(route('user-management.index', ['tab' => 'regions']))
        ->assertInertiaFlash('toast.message', 'Region deleted.');

    $this->assertModelMissing($region);

    $this->actingAs($manager)
        ->delete(route('user-management.regions.destroy', $manager->region))
        ->assertSessionHasErrors('region');

    $this->assertModelExists($manager->region);

    $this->actingAs($manager)
        ->delete(route('user-management.regions.destroy', $centralRegion))
        ->assertSessionHasErrors('region');

    $this->assertModelExists($centralRegion);
});

test('users can be searched and paginated', function () {
    $manager = userManager();
    $role = UserRole::query()->create(['name' => UserRole::RegionalOfficeStaff]);
    $manager->region->update(['name' => 'Region VII']);

    User::factory()
        ->count(11)
        ->for($role, 'userRole')
        ->for($manager->region)
        ->create();

    User::factory()
        ->for($role, 'userRole')
        ->for($manager->region)
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
        ->get(route('user-management.index', ['search' => 'ada@example.com']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.search', 'ada@example.com')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Ada Lovelace')
            ->where('users.data.0.email', 'ada@example.com')
            ->where('users.data.0.role', 'RO Staff')
            ->where('users.data.0.region', $manager->region->name)
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

    $this->actingAs(userManager(UserRole::RegionalOfficeAdministrator, $region))
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

test('office and super administrators can create users', function (string $managerRole, string $assignedRole) {
    $region = $managerRole === UserRole::RegionalOfficeAdministrator
        ? Region::factory()->create()
        : Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $email = "{$managerRole}@example.com";

    $this->actingAs(userManager($managerRole, $region))
        ->post(route('user-management.store'), [
            'name' => 'New Office User',
            'email' => $email,
            'password' => 'chedsprs2026',
            'user_role' => $assignedRole,
            'region_id' => $region->id,
        ])
        ->assertRedirect(route('user-management.index'))
        ->assertSessionHasNoErrors()
        ->assertInertiaFlash('toast.message', 'User created.');

    expect(User::query()->where('email', $email)->first())
        ->not->toBeNull()
        ->userRole->name->toBe($assignedRole);
})->with([
    'RO administrator' => [UserRole::RegionalOfficeAdministrator, UserRole::RegionalOfficeStaff],
    'CO administrator' => [UserRole::CentralOfficeAdministrator, UserRole::CentralOfficeStaff],
    'Super Admin' => [UserRole::SuperAdmin, UserRole::CentralOfficeStaff],
]);

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
    $targetUser = User::factory()
        ->for($originalRole, 'userRole')
        ->for($manager->region)
        ->create();
    $region = $manager->region;

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
    $targetUser = User::factory()->for($manager->region)->create();

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

test('user managers can only view and mutate users in their own region', function () {
    $managerRegion = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $manager = userManager(UserRole::RegionalOfficeAdministrator, $managerRegion);
    $regionalUser = User::factory()->for($managerRegion)->create();
    $otherUser = User::factory()->for($otherRegion)->create();

    $this->actingAs($manager)
        ->get(route('user-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.total', 2)
            ->where('regions.0.id', $managerRegion->id)
            ->has('regions', 1)
            ->where('users.data.0.id', fn (int $id): bool => in_array($id, [$manager->id, $regionalUser->id], true))
        );

    $this->actingAs($manager)
        ->delete(route('user-management.destroy', $otherUser))
        ->assertNotFound();

    $this->assertModelExists($otherUser);

    $this->actingAs($manager)
        ->post(route('user-management.store'), [
            'name' => 'Other Region User',
            'email' => 'other-region@example.com',
            'password' => 'chedsprs2026',
            'user_role' => UserRole::RegionalOfficeStaff,
            'region_id' => $otherRegion->id,
        ])
        ->assertSessionHasErrors('region_id');
});

test('super admins can view and filter users across regions', function () {
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $regionalOffice = Region::factory()->create(['name' => 'Regional Office I']);
    $manager = userManager(region: $centralRegion);
    $regionalUser = User::factory()->for($regionalOffice)->create();

    $this->actingAs($manager)
        ->get(route('user-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.total', 2)
            ->has('regions', 2)
            ->where('filters.region_id', '')
        );

    $this->actingAs($manager)
        ->get(route('user-management.index', ['region_id' => $regionalOffice->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.total', 1)
            ->where('users.data.0.id', $regionalUser->id)
            ->where('filters.region_id', $regionalOffice->id)
        );
});

test('central office roles must be assigned to the central office region', function () {
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $regionalOffice = Region::factory()->create();
    $manager = userManager(region: $centralRegion);

    $this->actingAs($manager)
        ->post(route('user-management.store'), [
            'name' => 'Central Administrator',
            'email' => 'central-admin@example.com',
            'password' => 'chedsprs2026',
            'user_role' => UserRole::CentralOfficeAdministrator,
            'region_id' => $regionalOffice->id,
        ])
        ->assertSessionHasErrors('region_id');

    $this->actingAs($manager)
        ->post(route('user-management.store'), [
            'name' => 'Central Administrator',
            'email' => 'central-admin@example.com',
            'password' => 'chedsprs2026',
            'user_role' => UserRole::CentralOfficeAdministrator,
            'region_id' => $centralRegion->id,
        ])
        ->assertRedirect(route('user-management.index'));

    expect(User::query()->where('email', 'central-admin@example.com')->value('region_id'))
        ->toBe($centralRegion->id);
});
