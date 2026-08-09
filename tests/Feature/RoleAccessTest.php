<?php

use App\Enums\UserRoleGroup;
use App\Models\Incident;
use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;

test('built in administrator roles receive the clarified management permissions', function (
    string $roleName,
    bool $canManage,
    bool $canManageRegions,
    bool $canRespond,
) {
    $region = str_starts_with($roleName, 'co-') || $roleName === UserRole::SuperAdmin
        ? Region::query()->firstOrCreate(['name' => Region::CentralOffice])
        : Region::factory()->create();
    $role = UserRole::query()->create(['name' => $roleName]);
    $user = User::factory()->for($region)->for($role, 'userRole')->create();

    expect($user->can('view-statistics'))->toBe($canManage)
        ->and($user->can('manage-forms'))->toBe($canManage)
        ->and($user->can('manage-users'))->toBe($canManage)
        ->and($user->can('manage-user-roles'))->toBe($canManage)
        ->and($user->can('manage-regions'))->toBe($canManageRegions)
        ->and($user->canFileIncidents())->toBe($canRespond)
        ->and($user->canRespondToIncidents())->toBe($canRespond)
        ->and($user->canManageIncidents())->toBe($canManage);
})->with([
    'Super Admin' => [UserRole::SuperAdmin, true, true, true],
    'CHEDCO Admin' => [UserRole::CentralOfficeAdministrator, true, false, true],
    'CHEDRO Admin' => [UserRole::RegionalOfficeAdministrator, true, false, true],
    'CHEDCO Staff' => [UserRole::CentralOfficeStaff, false, false, true],
    'CHEDRO Staff' => [UserRole::RegionalOfficeStaff, false, false, true],
    'Agency' => [UserRole::Agency, false, false, false],
]);

test('custom and agency roles receive view-only regional incident access', function (UserRoleGroup $group) {
    $region = $group === UserRoleGroup::CentralOffice
        ? Region::query()->firstOrCreate(['name' => Region::CentralOffice])
        : Region::factory()->create();
    $role = UserRole::query()->create([
        'name' => "custom-{$group->value}",
        'display_name' => "Custom {$group->label()}",
        'organization_group' => $group,
    ]);
    $user = User::factory()->for($region)->for($role, 'userRole')->create();
    $incident = Incident::factory()->for($region)->create(['status' => 'Pending']);

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertInertia(fn ($page) => $page
            ->where('access.can_file', false)
            ->where('access.can_manage', false)
        );

    $this->actingAs($user)->get(route('incidents.create'))->assertForbidden();
    $this->actingAs($user)->post(route('incidents.store'), [])->assertForbidden();

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Responder update'])
        ->assertForbidden();

    $this->actingAs($user)->get(route('statistics'))->assertForbidden();
    $this->actingAs($user)->get(route('form-management.index'))->assertForbidden();
    $this->actingAs($user)->get(route('user-management.index'))->assertForbidden();

    expect($incident->messages()->doesntExist())->toBeTrue();
})->with([
    'Central Office custom role' => UserRoleGroup::CentralOffice,
    'Regional Office custom role' => UserRoleGroup::RegionalOffice,
    'Agency custom role such as DepED' => UserRoleGroup::Agency,
]);
