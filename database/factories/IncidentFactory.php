<?php

namespace Database\Factories;

use App\Models\Incident;
use App\Models\IncidentSubcategory;
use App\Models\Region;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Incident>
 */
class IncidentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'incident_number' => null,
            'incident_subcategory_id' => IncidentSubcategory::factory(),
            'region_id' => Region::factory(),
            'status' => fake()->randomElement(['pending', 'resolved', 'unresolved']),
        ];
    }
}
