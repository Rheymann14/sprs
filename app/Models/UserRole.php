<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, User> $users
 */
#[Fillable(['name'])]
class UserRole extends Model
{
    use HasUlids;

    public const string Administrator = 'administrator';

    public const string SuperAdmin = 'super-admin';

    public const string CentralOfficeAdministrator = 'co-administrator';

    public const string CentralOfficeStaff = 'co-staff';

    public const string RegionalOfficeAdministrator = 'ro-administrator';

    public const string RegionalOfficeStaff = 'ro-staff';

    public const string Agency = 'agency';

    /**
     * Get the roles that may be assigned through user management.
     *
     * @return array<string, array<string, string>>
     */
    public static function assignmentGroups(): array
    {
        return [
            'CHED Central Office' => [
                self::SuperAdmin => 'Super Admin',
                self::CentralOfficeAdministrator => 'CO Administrator',
                self::CentralOfficeStaff => 'CO Staff',
            ],
            'CHED Regional Office' => [
                self::RegionalOfficeAdministrator => 'RO Administrator',
                self::RegionalOfficeStaff => 'RO Staff',
            ],
            'Agency' => [
                self::Agency => 'Agency',
            ],
        ];
    }

    /**
     * Get the role names that may be assigned through user management.
     *
     * @return list<string>
     */
    public static function assignableNames(): array
    {
        return array_keys(array_merge(...array_values(self::assignmentGroups())));
    }

    /**
     * Get the roles allowed to manage user accounts.
     *
     * @return list<string>
     */
    public static function userManagerNames(): array
    {
        return [
            self::Administrator,
            self::SuperAdmin,
            self::CentralOfficeAdministrator,
        ];
    }

    /**
     * Get the users assigned to this role.
     *
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
