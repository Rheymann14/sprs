<?php

namespace App\Models;

use Database\Factories\RegionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, User> $users
 * @property-read Collection<int, Incident> $incidents
 * @property-read Collection<int, Incident> $routedIncidents
 * @property-read Collection<int, IncidentForm> $incidentForms
 */
#[Fillable(['name'])]
class Region extends Model
{
    public const string CentralOffice = 'CHED Central Office';

    /** @use HasFactory<RegionFactory> */
    use HasFactory, HasUlids;

    /**
     * Get the users assigned to the region.
     *
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<Incident, $this>
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }

    /** @return BelongsToMany<Incident, $this> */
    public function routedIncidents(): BelongsToMany
    {
        return $this->belongsToMany(Incident::class)->withTimestamps();
    }

    /**
     * @return HasMany<IncidentForm, $this>
     */
    public function incidentForms(): HasMany
    {
        return $this->hasMany(IncidentForm::class);
    }
}
