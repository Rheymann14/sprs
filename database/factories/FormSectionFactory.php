<?php

namespace Database\Factories;

use App\Models\FormSection;
use App\Models\IncidentForm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FormSection>
 */
class FormSectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'incident_form_id' => IncidentForm::factory(),
            'title' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'sort_order' => 0,
        ];
    }
}
