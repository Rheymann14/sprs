<?php

namespace App\Models;

use App\Enums\UserRoleGroup;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $name
 * @property string $display_name
 * @property UserRoleGroup $organization_group
 * @property bool $is_system
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, User> $users
 */
#[Fillable(['name', 'display_name', 'organization_group', 'is_system'])]
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
     * Get the role names the given manager may assign.
     *
     * @return list<string>
     */
    public static function assignableNamesFor(User $manager): array
    {
        $managerGroup = $manager->roleGroup();
        $systemRoleNames = $manager->isSuperAdmin()
            ? self::assignableNames()
            : array_values(array_filter(
                array_keys(self::assignmentGroups()[$managerGroup?->label() ?? ''] ?? []),
                fn (string $roleName): bool => $roleName !== self::SuperAdmin,
            ));
        $customRoleNames = self::query()
            ->where('is_system', false)
            ->when(! $manager->isSuperAdmin(), fn ($query) => $query->where('organization_group', $managerGroup?->value))
            ->pluck('name')
            ->filter(fn (mixed $roleName): bool => is_string($roleName))
            ->all();

        return array_values(array_unique([...$systemRoleNames, ...$customRoleNames]));
    }

    public static function groupForName(string $name): UserRoleGroup
    {
        $storedGroup = self::query()->where('name', $name)->value('organization_group');

        return $storedGroup !== null
            ? UserRoleGroup::from($storedGroup)
            : UserRoleGroup::from(self::metadataForName($name)['organization_group']);
    }

    /**
     * Get the role names that cannot be deleted.
     *
     * @return list<string>
     */
    public static function protectedNames(): array
    {
        return [
            self::Administrator,
            ...self::assignableNames(),
        ];
    }

    /**
     * Get metadata for a role identifier.
     *
     * @return array{display_name: string, organization_group: string, is_system: bool}
     */
    public static function metadataForName(string $name): array
    {
        $definitions = [
            self::Administrator => ['Administrator', UserRoleGroup::CentralOffice],
            self::SuperAdmin => ['Super Admin', UserRoleGroup::CentralOffice],
            self::CentralOfficeAdministrator => ['CO Administrator', UserRoleGroup::CentralOffice],
            self::CentralOfficeStaff => ['CO Staff', UserRoleGroup::CentralOffice],
            self::RegionalOfficeAdministrator => ['RO Administrator', UserRoleGroup::RegionalOffice],
            self::RegionalOfficeStaff => ['RO Staff', UserRoleGroup::RegionalOffice],
            self::Agency => ['Agency', UserRoleGroup::Agency],
        ];
        [$displayName, $organizationGroup] = $definitions[$name]
            ?? [Str::headline($name), UserRoleGroup::Agency];

        return [
            'display_name' => $displayName,
            'organization_group' => $organizationGroup->value,
            'is_system' => isset($definitions[$name]),
        ];
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
            self::RegionalOfficeAdministrator,
        ];
    }

    /**
     * Get the roles allowed to manage regional form definitions and statistics.
     *
     * @return list<string>
     */
    public static function administratorNames(): array
    {
        return [
            self::Administrator,
            self::SuperAdmin,
            self::CentralOfficeAdministrator,
            self::RegionalOfficeAdministrator,
        ];
    }

    /**
     * Get the roles allowed to manage incident reports and routing.
     *
     * @return list<string>
     */
    public static function incidentAdministratorNames(): array
    {
        return [
            self::SuperAdmin,
            self::CentralOfficeAdministrator,
            self::RegionalOfficeAdministrator,
        ];
    }

    /**
     * Get the roles allowed to file reports and respond to conversations.
     *
     * @return list<string>
     */
    public static function incidentResponderNames(): array
    {
        return [
            ...self::incidentAdministratorNames(),
            self::CentralOfficeStaff,
            self::RegionalOfficeStaff,
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

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'organization_group' => UserRoleGroup::class,
            'is_system' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (UserRole $role): void {
            $metadata = self::metadataForName($role->name);

            $role->display_name = $role->display_name ?: $metadata['display_name'];
            $role->organization_group = $role->getAttribute('organization_group') ?: $metadata['organization_group'];
            $role->is_system = $metadata['is_system'] || $role->is_system;
        });
    }
}
