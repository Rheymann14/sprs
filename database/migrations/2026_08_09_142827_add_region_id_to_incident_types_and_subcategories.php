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
        if (! Schema::hasColumn('incident_types', 'region_id')) {
            Schema::table('incident_types', function (Blueprint $table) {
                $table->dropUnique(['name']);
                $table->foreignUlid('region_id')
                    ->nullable()
                    ->index()
                    ->after('id')
                    ->constrained()
                    ->restrictOnDelete();
                $table->unique(['region_id', 'name']);
            });
        }

        if (! Schema::hasColumn('incident_subcategories', 'region_id')) {
            Schema::table('incident_subcategories', function (Blueprint $table) {
                $table->index('incident_type_id');
            });

            Schema::table('incident_subcategories', function (Blueprint $table) {
                $table->dropUnique(['incident_type_id', 'name']);
                $table->foreignUlid('region_id')
                    ->nullable()
                    ->index()
                    ->after('incident_type_id')
                    ->constrained()
                    ->restrictOnDelete();
                $table->unique(['region_id', 'incident_type_id', 'name']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_subcategories', function (Blueprint $table) {
            $table->dropUnique(['region_id', 'incident_type_id', 'name']);
            $table->dropConstrainedForeignId('region_id');
            $table->unique(['incident_type_id', 'name']);
        });

        Schema::table('incident_subcategories', function (Blueprint $table) {
            $table->dropIndex(['incident_type_id']);
        });

        Schema::table('incident_types', function (Blueprint $table) {
            $table->dropUnique(['region_id', 'name']);
            $table->dropConstrainedForeignId('region_id');
            $table->unique('name');
        });
    }
};
