<?php

namespace App\Models;

use Database\Factories\IncidentTypeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $region_id
 * @property string $name
 * @property-read Region $region
 * @property-read Collection<int, IncidentSubcategory> $subcategories
 */
#[Fillable(['region_id', 'name'])]
class IncidentType extends Model
{
    /** @use HasFactory<IncidentTypeFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Region, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * @return HasMany<IncidentSubcategory, $this>
     */
    public function subcategories(): HasMany
    {
        return $this->hasMany(IncidentSubcategory::class)->orderBy('name');
    }
}
