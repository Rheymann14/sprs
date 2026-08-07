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
        Schema::create('incident_types', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('incident_subcategories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('incident_type_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['incident_type_id', 'name']);
        });

        Schema::create('incident_forms', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('incident_subcategory_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('form_sections', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('incident_form_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();

            $table->unique(['incident_form_id', 'sort_order']);
        });

        Schema::create('form_fields', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('form_section_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('placeholder')->nullable();
            $table->boolean('is_required')->default(false);
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();

            $table->unique(['form_section_id', 'sort_order']);
            $table->index(['type', 'is_required']);
        });

        Schema::create('form_field_options', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('form_field_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('value');
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();

            $table->unique(['form_field_id', 'value']);
            $table->unique(['form_field_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_field_options');
        Schema::dropIfExists('form_fields');
        Schema::dropIfExists('form_sections');
        Schema::dropIfExists('incident_forms');
        Schema::dropIfExists('incident_subcategories');
        Schema::dropIfExists('incident_types');
    }
};
