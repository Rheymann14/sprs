<?php

namespace Database\Factories;

use App\Models\IncidentForm;
use App\Models\IncidentSubcategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncidentForm>
 */
class IncidentFormFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'incident_subcategory_id' => IncidentSubcategory::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
