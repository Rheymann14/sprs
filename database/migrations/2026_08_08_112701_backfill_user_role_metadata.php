<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $systemRoles = [
            'administrator' => ['Administrator', 'central-office'],
            'super-admin' => ['Super Admin', 'central-office'],
            'co-administrator' => ['CO Administrator', 'central-office'],
            'co-staff' => ['CO Staff', 'central-office'],
            'ro-administrator' => ['RO Administrator', 'regional-office'],
            'ro-staff' => ['RO Staff', 'regional-office'],
            'agency' => ['Agency', 'agency'],
        ];

        foreach (DB::table('user_roles')->select('id', 'name')->orderBy('id')->get() as $role) {
            [$displayName, $organizationGroup] = $systemRoles[$role->name]
                ?? [Str::headline($role->name), 'agency'];

            DB::table('user_roles')
                ->where('id', $role->id)
                ->update([
                    'display_name' => $displayName,
                    'organization_group' => $organizationGroup,
                    'is_system' => isset($systemRoles[$role->name]),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('user_roles')->update([
            'display_name' => null,
            'organization_group' => null,
            'is_system' => false,
        ]);
    }
};
