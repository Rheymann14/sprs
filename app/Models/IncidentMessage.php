<?php

namespace App\Models;

use Database\Factories\IncidentMessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $incident_id
 * @property int $user_id
 * @property string|null $message
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Incident $incident
 * @property-read User $user
 * @property-read Collection<int, IncidentMessageAttachment> $attachments
 */
#[Fillable(['incident_id', 'user_id', 'message'])]
class IncidentMessage extends Model
{
    /** @use HasFactory<IncidentMessageFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Incident, $this> */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<IncidentMessageAttachment, $this> */
    public function attachments(): HasMany
    {
        return $this->hasMany(IncidentMessageAttachment::class);
    }
}
