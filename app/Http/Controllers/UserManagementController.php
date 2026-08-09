<?php

namespace App\Http\Controllers;

use App\Enums\UserRoleGroup;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $manager = $request->user();
        $search = $request->string('search')->trim()->toString();
        $roleSearch = $request->string('role_search')->trim()->toString();
        $regionSearch = $request->string('region_search')->trim()->toString();
        $requestedRegionId = $request->string('region_id')->trim()->toString();
        $regionId = $manager->isSuperAdmin()
            ? Region::query()->whereKey($requestedRegionId)->value('id')
            : $manager->region_id;
        $canManageRoles = $manager->can('manage-user-roles');
        $canManageRegions = $manager->can('manage-regions');
        $requestedTab = $request->string('tab')->toString();
        $activeTab = match ($requestedTab) {
            'roles' => $canManageRoles ? 'roles' : 'users',
            'regions' => $canManageRegions ? 'regions' : 'users',
            default => 'users',
        };
        $assignmentGroups = UserRole::assignmentGroups();

        if (! $manager->isSuperAdmin()) {
            $managerGroupLabel = $manager->roleGroup()?->label();
            $assignmentGroups = collect($assignmentGroups)
                ->only($managerGroupLabel)
                ->map(function (array $roles): array {
                    unset($roles[UserRole::SuperAdmin]);

                    return $roles;
                })
                ->all();
        }

        $customRoles = UserRole::query()
            ->select('name', 'display_name', 'organization_group')
            ->where('is_system', false)
            ->when(! $manager->isSuperAdmin(), fn (Builder $query) => $query->where('organization_group', $manager->roleGroup()?->value))
            ->orderBy('display_name')
            ->get();

        foreach ($customRoles as $customRole) {
            $assignmentGroups[$customRole->organization_group->label()][$customRole->name] = $customRole->display_name;
        }

        $roleLabels = collect($assignmentGroups)
            ->flatMap(fn (array $roles): array => $roles)
            ->put(UserRole::Administrator, 'Administrator');
        $matchingRoleNames = $roleLabels
            ->filter(fn (string $label): bool => Str::contains(Str::lower($label), Str::lower($search)))
            ->keys();
        $matchingManagedRoleNames = $roleLabels
            ->filter(fn (string $label): bool => Str::contains(Str::lower($label), Str::lower($roleSearch)))
            ->keys();

        return Inertia::render('user-management/index', [
            'users' => User::query()
                ->select('id', 'name', 'email', 'user_role_id', 'region_id', 'created_at')
                ->when($regionId !== null, fn (Builder $query) => $query->where('region_id', $regionId))
                ->with(['userRole:id,name,display_name', 'region:id,name'])
                ->when($search !== '', function (Builder $query) use ($matchingRoleNames, $search): void {
                    $query->where(function (Builder $searchQuery) use ($matchingRoleNames, $search): void {
                        $searchQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhereHas('userRole', function (Builder $roleQuery) use ($matchingRoleNames, $search): void {
                                $roleQuery
                                    ->where('name', 'like', "%{$search}%")
                                    ->orWhereIn('name', $matchingRoleNames);
                            })
                            ->orWhereHas('region', function (Builder $regionQuery) use ($search): void {
                                $regionQuery->where('name', 'like', "%{$search}%");
                            });
                    });
                })
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->userRole
                        ? $user->userRole->display_name
                        : 'Unassigned',
                    'role_value' => $user->userRole?->name ?? '',
                    'region' => $user->region?->name ?? 'Unassigned',
                    'region_id' => $user->region_id ?? '',
                    'created_at' => $user->created_at?->toIso8601String(),
                    'created_at_display' => $user->created_at?->format('M d, Y'),
                    'can_delete' => $manager->isNot($user) && $manager->canAccessRegion($user->region_id),
                ]),
            'filters' => [
                'search' => $search,
                'role_search' => $roleSearch,
                'region_search' => $regionSearch,
                'region_id' => $regionId ?? '',
                'tab' => $activeTab,
            ],
            'canManageRoles' => $canManageRoles,
            'canManageRegions' => $canManageRegions,
            'roleGroupOptions' => collect(UserRoleGroup::cases())
                ->map(fn (UserRoleGroup $group): array => [
                    'value' => $group->value,
                    'label' => $group->label(),
                ]),
            'roleGroups' => collect($assignmentGroups)
                ->map(fn (array $roles, string $group): array => [
                    'label' => $group,
                    'options' => collect($roles)
                        ->map(fn (string $label, string $value): array => [
                            'value' => $value,
                            'label' => $label,
                        ])
                        ->values(),
                ])
                ->values(),
            'roles' => fn () => $canManageRoles
                ? UserRole::query()
                    ->select('id', 'name', 'display_name', 'organization_group', 'is_system', 'created_at')
                    ->withCount('users')
                    ->when(! $manager->isSuperAdmin(), fn (Builder $query) => $query->where('organization_group', $manager->roleGroup()?->value))
                    ->when($roleSearch !== '', function (Builder $query) use ($matchingManagedRoleNames, $roleSearch): void {
                        $query->where(function (Builder $searchQuery) use ($matchingManagedRoleNames, $roleSearch): void {
                            $searchQuery
                                ->where('name', 'like', "%{$roleSearch}%")
                                ->orWhere('display_name', 'like', "%{$roleSearch}%")
                                ->orWhereIn('name', $matchingManagedRoleNames);
                        });
                    })
                    ->orderBy('name')
                    ->paginate(10, ['*'], 'roles_page')
                    ->withQueryString()
                    ->through(fn (UserRole $role): array => [
                        'id' => $role->id,
                        'name' => $role->display_name,
                        'organization_group' => $role->organization_group->value,
                        'group' => $role->organization_group->label(),
                        'users_count' => $role->users_count,
                        'can_edit' => ! $role->is_system,
                        'can_delete' => ! $role->is_system && $role->users_count === 0,
                    ])
                : null,
            'regions' => Region::query()
                ->select('id', 'name')
                ->when(! $manager->isSuperAdmin(), fn (Builder $query) => $query->whereKey($manager->region_id))
                ->withCount('users')
                ->orderBy('name')
                ->get(),
            'managedRegions' => fn () => $canManageRegions
                ? Region::query()
                    ->select('id', 'name', 'created_at')
                    ->withCount(['users', 'incidents', 'incidentForms'])
                    ->when($regionSearch !== '', fn (Builder $query) => $query->where('name', 'like', "%{$regionSearch}%"))
                    ->orderBy('name')
                    ->paginate(10, ['*'], 'regions_page')
                    ->withQueryString()
                    ->through(fn (Region $region): array => [
                        'id' => $region->id,
                        'name' => $region->name,
                        'users_count' => $region->users_count,
                        'can_delete' => $region->name !== Region::CentralOffice
                            && $region->users_count === 0
                            && $region->incidents_count === 0
                            && $region->incident_forms_count === 0,
                    ])
                : null,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $role = UserRole::query()->firstOrCreate([
                'name' => $validated['user_role'],
            ]);

            User::query()->create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'user_role_id' => $role->id,
                'region_id' => $validated['region_id'],
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User created.')]);

        return to_route('user-management.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->canAccessRegion($user->region_id), 404);

        $validated = $request->validated();

        DB::transaction(function () use ($request, $user, $validated): void {
            $role = UserRole::query()->firstOrCreate([
                'name' => $validated['user_role'],
            ]);

            $attributes = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'user_role_id' => $role->id,
                'region_id' => $validated['region_id'],
            ];

            if ($request->filled('password')) {
                $attributes['password'] = $validated['password'];
            }

            $user->update($attributes);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return to_route('user-management.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->canAccessRegion($user->region_id), 404);
        abort_if($request->user()?->is($user), 403, 'You cannot delete your own account.');

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('user-management.index');
    }
}
