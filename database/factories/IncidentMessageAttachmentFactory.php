<?php

namespace Database\Factories;

use App\Models\IncidentMessage;
use App\Models\IncidentMessageAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncidentMessageAttachment>
 */
class IncidentMessageAttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'incident_message_id' => IncidentMessage::factory(),
            'attachment_type_id' => null,
            'original_name' => fake()->word().'.pdf',
            'path' => 'incident-messages/'.fake()->uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'size' => fake()->numberBetween(1_024, 5_242_880),
        ];
    }
}
