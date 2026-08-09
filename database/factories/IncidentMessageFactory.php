<?php

namespace Database\Factories;

use App\Models\Incident;
use App\Models\IncidentMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncidentMessage>
 */
class IncidentMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'incident_id' => Incident::factory(),
            'user_id' => User::factory(),
            'message' => fake()->sentence(),
        ];
    }
}
