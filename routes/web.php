<?php

use App\Http\Controllers\FormManagementController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\IncidentFormController;
use App\Http\Controllers\IncidentSubcategoryController;
use App\Http\Controllers\IncidentTypeController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('statistics', StatisticsController::class)
    ->middleware(['auth', 'verified'])
    ->name('statistics');

Route::get('incidents', [IncidentController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('incidents.index');

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
});

require __DIR__.'/settings.php';
