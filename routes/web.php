<?php

use App\Http\Controllers\FormManagementController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\IncidentFormController;
use App\Http\Controllers\IncidentMessageController;
use App\Http\Controllers\IncidentStatusController;
use App\Http\Controllers\IncidentSubcategoryController;
use App\Http\Controllers\IncidentTypeController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\UserRoleController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('statistics', StatisticsController::class)
    ->middleware(['auth', 'verified', 'can:view-statistics'])
    ->name('statistics');

Route::get('incidents', [IncidentController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.index');
Route::get('incidents/report', [IncidentController::class, 'create'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.create');
Route::get('incidents/report/{incident}', [IncidentController::class, 'edit'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.edit');
Route::get('incidents/{incident}', [IncidentController::class, 'show'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.show');
Route::post('incidents/{incident}/messages', [IncidentMessageController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.messages.store');
Route::post('incidents', [IncidentController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.store');
Route::put('incidents/{incident}', [IncidentController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.update');
Route::patch('incidents/{incident}/status', [IncidentController::class, 'updateStatus'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.status.update');
Route::delete('incidents/{incident}', [IncidentController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.destroy');

Route::middleware(['auth', 'verified', 'can:manage-forms'])->group(function () {
    Route::get('form-management', [FormManagementController::class, 'index'])
        ->name('form-management.index');

    Route::post('incident-types', [IncidentTypeController::class, 'store'])
        ->name('incident-types.store');
    Route::put('incident-types/{incident_type}', [IncidentTypeController::class, 'update'])
        ->name('incident-types.update');
    Route::delete('incident-types/{incident_type}', [IncidentTypeController::class, 'destroy'])
        ->name('incident-types.destroy');

    Route::post('incident-types/{incident_type}/subcategories', [IncidentSubcategoryController::class, 'store'])
        ->name('incident-types.subcategories.store');
    Route::put('incident-types/{incident_type}/subcategories/{subcategory}', [IncidentSubcategoryController::class, 'update'])
        ->scopeBindings()
        ->name('incident-types.subcategories.update');
    Route::delete('incident-types/{incident_type}/subcategories/{subcategory}', [IncidentSubcategoryController::class, 'destroy'])
        ->scopeBindings()
        ->name('incident-types.subcategories.destroy');
    Route::put('incident-types/{incident_type}/subcategories/{subcategory}/statuses', [IncidentStatusController::class, 'update'])
        ->scopeBindings()
        ->name('incident-types.subcategories.statuses.update');

    Route::put('incident-subcategories/{incident_subcategory}/form', [IncidentFormController::class, 'update'])
        ->name('incident-subcategories.form.update');
});

Route::middleware(['auth', 'verified', 'can:manage-users'])->group(function () {
    Route::get('user-management', [UserManagementController::class, 'index'])
        ->name('user-management.index');
    Route::post('user-management', [UserManagementController::class, 'store'])
        ->name('user-management.store');
    Route::put('user-management/{user}', [UserManagementController::class, 'update'])
        ->name('user-management.update');
    Route::delete('user-management/{user}', [UserManagementController::class, 'destroy'])
        ->name('user-management.destroy');

    Route::middleware('can:manage-user-roles')->group(function () {
        Route::post('user-management/roles', [UserRoleController::class, 'store'])
            ->name('user-management.roles.store');
        Route::put('user-management/roles/{user_role}', [UserRoleController::class, 'update'])
            ->name('user-management.roles.update');
        Route::delete('user-management/roles/{user_role}', [UserRoleController::class, 'destroy'])
            ->name('user-management.roles.destroy');
    });

    Route::middleware('can:manage-regions')->group(function () {
        Route::post('user-management/regions', [RegionController::class, 'store'])
            ->name('user-management.regions.store');
        Route::delete('user-management/regions/{region}', [RegionController::class, 'destroy'])
            ->name('user-management.regions.destroy');
    });
});

require __DIR__.'/settings.php';
