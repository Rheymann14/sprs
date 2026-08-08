<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRoleRequest;
use App\Http\Requests\UpdateUserRoleRequest;
use App\Models\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserRoleController extends Controller
{
    public function store(StoreUserRoleRequest $request): RedirectResponse
    {
        UserRole::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('user-management.index', ['tab' => 'roles']);
    }

    public function update(UpdateUserRoleRequest $request, UserRole $userRole): RedirectResponse
    {
        $userRole->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('user-management.index', ['tab' => 'roles']);
    }

    public function destroy(Request $request, UserRole $userRole): RedirectResponse
    {
        abort_unless($request->user()?->can('manage-user-directories'), 403);

        if ($userRole->is_system) {
            throw ValidationException::withMessages([
                'role' => __('Built-in roles cannot be deleted.'),
            ]);
        }

        if ($userRole->users()->exists()) {
            throw ValidationException::withMessages([
                'role' => __('This role cannot be deleted while users are assigned to it.'),
            ]);
        }

        $userRole->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('user-management.index', ['tab' => 'roles']);
    }
}
