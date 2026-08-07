<?php

namespace App\Http\Controllers;

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
        $search = $request->string('search')->trim()->toString();
        $roleLabels = collect(UserRole::assignmentGroups())
            ->flatMap(fn (array $roles): array => $roles)
            ->put(UserRole::Administrator, 'Administrator');
        $matchingRoleNames = $roleLabels
            ->filter(fn (string $label): bool => Str::contains(Str::lower($label), Str::lower($search)))
            ->keys();

        return Inertia::render('user-management/index', [
            'users' => User::query()
                ->select('id', 'name', 'email', 'user_role_id', 'region_id', 'created_at')
                ->with(['userRole:id,name', 'region:id,name'])
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
                        ? $roleLabels->get($user->userRole->name, Str::headline($user->userRole->name))
                        : 'Unassigned',
                    'role_value' => $user->userRole?->name ?? '',
                    'region' => $user->region?->name ?? 'Unassigned',
                    'region_id' => $user->region_id ?? '',
                    'created_at' => $user->created_at?->toIso8601String(),
                    'created_at_display' => $user->created_at?->format('M d, Y'),
                    'can_delete' => $request->user()?->isNot($user) ?? false,
                ]),
            'filters' => [
                'search' => $search,
            ],
            'roleGroups' => collect(UserRole::assignmentGroups())
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
            'regions' => Region::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
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
        abort_if($request->user()?->is($user), 403, 'You cannot delete your own account.');

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('user-management.index');
    }
}
