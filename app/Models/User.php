<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRoleGroup;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $user_role_id
 * @property string|null $region_id
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read UserRole|null $userRole
 * @property-read Region|null $region
 * @property-read Collection<int, IncidentMessage> $incidentMessages
 */
#[Fillable(['name', 'email', 'password', 'user_role_id', 'region_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the user's application role.
     *
     * @return BelongsTo<UserRole, $this>
     */
    public function userRole(): BelongsTo
    {
        return $this->belongsTo(UserRole::class);
    }

    /**
     * Get the user's region.
     *
     * @return BelongsTo<Region, $this>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /** @return HasMany<IncidentMessage, $this> */
    public function incidentMessages(): HasMany
    {
        return $this->hasMany(IncidentMessage::class);
    }

    public function hasRole(string ...$roleNames): bool
    {
        $this->loadMissing('userRole');

        return $this->userRole !== null
            && in_array($this->userRole->name, $roleNames, true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(UserRole::SuperAdmin);
    }

    public function canAccessRegion(?string $regionId): bool
    {
        return $regionId !== null
            && ($this->isSuperAdmin() || $this->region_id === $regionId);
    }

    public function roleGroup(): ?UserRoleGroup
    {
        $this->loadMissing('userRole');

        return $this->userRole?->organization_group;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
