<?php

namespace Database\Factories;

use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncidentSubcategory>
 */
class IncidentSubcategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'incident_type_id' => IncidentType::factory(),
            'name' => fake()->words(2, true),
        ];
    }
}
