<?php

namespace Database\Factories;

use App\Models\FormField;
use App\Models\FormFieldOption;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FormFieldOption>
 */
class FormFieldOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = fake()->unique()->word();

        return [
            'form_field_id' => FormField::factory(),
            'label' => $label,
            'value' => Str::slug($label),
            'sort_order' => 0,
        ];
    }
}
