<?php

namespace App\Models;

use Database\Factories\IncidentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $incident_number
 * @property string $incident_subcategory_id
 * @property string $region_id
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read IncidentSubcategory $subcategory
 * @property-read Region $region
 */
#[Fillable(['incident_subcategory_id', 'region_id', 'status'])]
class Incident extends Model
{
    /** @use HasFactory<IncidentFactory> */
    use HasFactory, HasUlids;

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => 'pending',
    ];

    /**
     * @return BelongsTo<IncidentSubcategory, $this>
     */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(IncidentSubcategory::class, 'incident_subcategory_id');
    }

    /**
     * @return BelongsTo<Region, $this>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Incident $incident): void {
            if ($incident->incident_number) {
                return;
            }

            $subcategory = IncidentSubcategory::query()
                ->with('incidentType:id,name')
                ->findOrFail($incident->incident_subcategory_id);
            $typeCode = Str::of($subcategory->incidentType->name)
                ->ascii()
                ->upper()
                ->replaceMatches('/[^A-Z0-9]+/', '-')
                ->trim('-');

            do {
                $suffix = Str::upper(Str::random(4));
                $incidentNumber = now()->format('Y')."-{$typeCode}-{$suffix}";
            } while (static::query()->where('incident_number', $incidentNumber)->exists());

            $incident->incident_number = $incidentNumber;
        });
    }
}
