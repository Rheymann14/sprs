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
        Schema::table('incident_types', function (Blueprint $table) {
            $table->ulid('region_id')->nullable(false)->change();
        });

        Schema::table('incident_subcategories', function (Blueprint $table) {
            $table->ulid('region_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_subcategories', function (Blueprint $table) {
            $table->ulid('region_id')->nullable()->change();
        });

        Schema::table('incident_types', function (Blueprint $table) {
            $table->ulid('region_id')->nullable()->change();
        });
    }
};
