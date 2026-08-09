<?php

namespace App\Providers;

use App\Models\User;
use App\Models\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Gate::before(fn (User $user): ?bool => $user->isSuperAdmin() ? true : null);

        Gate::define('view-statistics', fn (User $user): bool => $user->hasRole(...UserRole::administratorNames()));

        Gate::define('manage-forms', fn (User $user): bool => $user->hasRole(...UserRole::administratorNames()));

        Gate::define('manage-users', fn (User $user): bool => $user->hasRole(...UserRole::userManagerNames()));

        Gate::define('manage-user-roles', fn (User $user): bool => $user->hasRole(...UserRole::userManagerNames()));

        Gate::define('manage-regions', fn (User $user): bool => $user->isSuperAdmin());

        Gate::define('manage-incident-statuses', fn (User $user): bool => $user->hasRole(
            UserRole::CentralOfficeAdministrator,
            UserRole::RegionalOfficeAdministrator,
        ));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
