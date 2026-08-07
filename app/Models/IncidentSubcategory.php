<?php

namespace App\Models;

use Database\Factories\IncidentSubcategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property string $id
 * @property string $incident_type_id
 * @property string $name
 * @property-read IncidentType $incidentType
 * @property-read IncidentForm|null $form
 */
#[Fillable(['name'])]
class IncidentSubcategory extends Model
{
    /** @use HasFactory<IncidentSubcategoryFactory> */
    use HasFactory, HasUlids;

    /**
     * @return BelongsTo<IncidentType, $this>
     */
    public function incidentType(): BelongsTo
    {
        return $this->belongsTo(IncidentType::class);
    }

    /**
     * @return HasOne<IncidentForm, $this>
     */
    public function form(): HasOne
    {
        return $this->hasOne(IncidentForm::class);
    }
}
