<?php

namespace App\Models;

use Database\Factories\IncidentSubcategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property string $id
 * @property string $incident_type_id
 * @property string $name
 * @property-read IncidentType $incidentType
 * @property-read IncidentForm|null $form
 * @property-read Collection<int, Incident> $incidents
 * @property-read Collection<int, IncidentStatus> $statuses
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

    /**
     * @return HasMany<IncidentForm, $this>
     */
    public function forms(): HasMany
    {
        return $this->hasMany(IncidentForm::class);
    }

    /**
     * @return HasMany<Incident, $this>
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }

    /** @return HasMany<IncidentStatus, $this> */
    public function statuses(): HasMany
    {
        return $this->hasMany(IncidentStatus::class)->orderBy('sort_order');
    }
}
