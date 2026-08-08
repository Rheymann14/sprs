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
        Schema::create('incident_statuses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('incident_subcategory_id')->constrained()->cascadeOnDelete();
            $table->string('name', 32);
            $table->string('icon', 32);
            $table->unsignedTinyInteger('sort_order');
            $table->timestamps();

            $table->unique(['incident_subcategory_id', 'name']);
            $table->unique(['incident_subcategory_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_statuses');
    }
};
