<?php

namespace App\Models;

use Database\Factories\IncidentFormFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $incident_subcategory_id
 * @property string $title
 * @property string|null $description
 * @property-read IncidentSubcategory $subcategory
 * @property-read Collection<int, FormSection> $sections
 */
#[Fillable(['title', 'description'])]
class IncidentForm extends Model
{
    /** @use HasFactory<IncidentFormFactory> */
    use HasFactory, HasUlids;

    /**
     * @return BelongsTo<IncidentSubcategory, $this>
     */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(IncidentSubcategory::class, 'incident_subcategory_id');
    }

    /**
     * @return HasMany<FormSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(FormSection::class)->orderBy('sort_order');
    }
}
