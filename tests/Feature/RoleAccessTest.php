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
        ->and($user->can('manage-regions'))->toBe($canManageRegions);
})->with([
    'Super Admin' => [UserRole::SuperAdmin, true, true],
    'CHEDCO Admin' => [UserRole::CentralOfficeAdministrator, true, false],
    'CHEDRO Admin' => [UserRole::RegionalOfficeAdministrator, true, false],
    'CHEDCO Staff' => [UserRole::CentralOfficeStaff, false, false],
    'CHEDRO Staff' => [UserRole::RegionalOfficeStaff, false, false],
    'Agency' => [UserRole::Agency, false, false],
]);

test('custom and agency roles only receive regional incident responder access', function (UserRoleGroup $group) {
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
        ->assertSuccessful();

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Responder update'])
        ->assertRedirect();

    $this->actingAs($user)->get(route('statistics'))->assertForbidden();
    $this->actingAs($user)->get(route('form-management.index'))->assertForbidden();
    $this->actingAs($user)->get(route('user-management.index'))->assertForbidden();

    expect($incident->messages()->value('message'))->toBe('Responder update');
})->with([
    'Central Office custom role' => UserRoleGroup::CentralOffice,
    'Regional Office custom role' => UserRoleGroup::RegionalOffice,
    'Agency custom role such as DepED' => UserRoleGroup::Agency,
]);
