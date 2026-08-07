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
        Schema::table('incident_forms', function (Blueprint $table) {
            $table->index('incident_subcategory_id');
        });

        Schema::table('incident_forms', function (Blueprint $table) {
            $table->dropUnique(['incident_subcategory_id']);
            $table->foreignUlid('region_id')
                ->nullable()
                ->after('incident_subcategory_id')
                ->constrained()
                ->restrictOnDelete();
            $table->unique(['incident_subcategory_id', 'region_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_forms', function (Blueprint $table) {
            $table->dropUnique(['incident_subcategory_id', 'region_id']);
            $table->dropConstrainedForeignId('region_id');
            $table->unique('incident_subcategory_id');
        });

        Schema::table('incident_forms', function (Blueprint $table) {
            $table->dropIndex(['incident_subcategory_id']);
        });
    }
};
