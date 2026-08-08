<?php

namespace Database\Factories;

use App\Enums\IncidentStatusIcon;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncidentStatus>
 */
class IncidentStatusFactory extends Factory
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
            'name' => fake()->unique()->word(),
            'icon' => fake()->randomElement(IncidentStatusIcon::cases()),
            'sort_order' => fake()->numberBetween(0, 2),
        ];
    }
}
