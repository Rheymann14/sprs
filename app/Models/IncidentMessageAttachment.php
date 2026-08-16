<?php

namespace App\Models;

use Database\Factories\IncidentMessageAttachmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $incident_message_id
 * @property string|null $attachment_type_id
 * @property string $original_name
 * @property string $path
 * @property string $mime_type
 * @property int $size
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read IncidentMessage $message
 * @property-read AttachmentType|null $attachmentType
 */
#[Fillable(['incident_message_id', 'attachment_type_id', 'original_name', 'path', 'mime_type', 'size'])]
class IncidentMessageAttachment extends Model
{
    /** @use HasFactory<IncidentMessageAttachmentFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<IncidentMessage, $this> */
    public function message(): BelongsTo
    {
        return $this->belongsTo(IncidentMessage::class, 'incident_message_id');
    }

    /** @return BelongsTo<AttachmentType, $this> */
    public function attachmentType(): BelongsTo
    {
        return $this->belongsTo(AttachmentType::class);
    }
}
