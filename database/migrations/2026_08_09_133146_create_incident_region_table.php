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
        Schema::create('incident_region', function (Blueprint $table) {
            $table->foreignUlid('incident_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('region_id')->constrained()->restrictOnDelete();
            $table->timestamps();

            $table->primary(['incident_id', 'region_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_region');
    }
};
