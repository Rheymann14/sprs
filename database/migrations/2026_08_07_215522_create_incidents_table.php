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
        Schema::create('incidents', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('incident_number')->unique();
            $table->foreignUlid('incident_subcategory_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('region_id')->constrained()->restrictOnDelete();
            $table->string('status', 32)->default('pending')->index();
            $table->timestamps();

            $table->index(['region_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
