<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            $table->string('display_name')->nullable()->unique()->after('name');
            $table->string('organization_group', 32)->nullable()->index()->after('display_name');
            $table->boolean('is_system')->default(false)->after('organization_group');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'organization_group', 'is_system']);
        });
    }
};
