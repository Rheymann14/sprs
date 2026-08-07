<?php

namespace Database\Factories;

use App\Enums\FormFieldType;
use App\Models\FormField;
use App\Models\FormSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FormField>
 */
class FormFieldFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'form_section_id' => FormSection::factory(),
            'type' => FormFieldType::Text,
            'label' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'placeholder' => fake()->optional()->words(2, true),
            'is_required' => false,
            'sort_order' => 0,
        ];
    }
}
