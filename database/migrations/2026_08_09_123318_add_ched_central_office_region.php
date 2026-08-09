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
        $now = now();

        DB::table('regions')->insertOrIgnore([
            'id' => (string) Str::ulid(),
            'name' => 'CHED Central Office',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $centralOfficeRegionId = DB::table('regions')
            ->where('name', 'CHED Central Office')
            ->value('id');

        DB::table('users')
            ->whereIn('user_role_id', DB::table('user_roles')
                ->select('id')
                ->where('organization_group', 'central-office'))
            ->update([
                'region_id' => $centralOfficeRegionId,
                'updated_at' => $now,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Existing central-office assignments cannot be restored safely.
    }
};
