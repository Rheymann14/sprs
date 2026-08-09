<?php

namespace App\Models;

use App\Enums\IncidentStatusIcon;
use App\Enums\UserRoleGroup;
use Database\Factories\IncidentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $incident_number
 * @property string $incident_subcategory_id
 * @property string $region_id
 * @property string $status
 * @property array<string, mixed>|null $report_data
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read IncidentSubcategory $subcategory
 * @property-read Region $region
 * @property-read Collection<int, Region> $routedRegions
 * @property-read Collection<int, IncidentMessage> $messages
 */
#[Fillable(['incident_subcategory_id', 'region_id', 'status', 'report_data'])]
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

    /** @return BelongsToMany<Region, $this> */
    public function routedRegions(): BelongsToMany
    {
        return $this->belongsToMany(Region::class)->withTimestamps();
    }

    public function isAccessibleBy(User $user): bool
    {
        return $user->isSuperAdmin()
            || $user->region_id === $this->region_id
            || ($user->region_id !== null && $this->routedRegions()->whereKey($user->region_id)->exists());
    }

    public function routingIsManageableBy(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->region_id !== $this->region_id) {
            return false;
        }

        $originatesFromCentralOffice = $this->region()->where('name', Region::CentralOffice)->exists();

        return $originatesFromCentralOffice
            ? $user->roleGroup() === UserRoleGroup::CentralOffice
            : $user->roleGroup() === UserRoleGroup::RegionalOffice;
    }

    /** @return HasMany<IncidentMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(IncidentMessage::class);
    }

    /** @return SupportCollection<int, array{name: string, icon: string}> */
    public function managedStatusDefinitions(): SupportCollection
    {
        $this->loadMissing('subcategory.statuses');

        if ($this->subcategory->statuses->isEmpty()) {
            return collect(IncidentStatus::defaults())->map(
                fn (array $status): array => $this->normalizedManagedStatusDefinition(
                    $status['name'],
                    $status['icon'],
                ),
            );
        }

        return $this->subcategory->statuses
            ->sortBy('sort_order')
            ->values()
            ->map(fn (IncidentStatus $status): array => $this->normalizedManagedStatusDefinition(
                $status->name,
                $status->icon->value,
            ));
    }

    /** @return array{name: string, icon: string} */
    public function managedStatusDefinition(): array
    {
        return $this->managedStatusDefinitions()->first(
            fn (array $status): bool => Str::lower($status['name']) === Str::lower($this->status),
        ) ?? [
            'name' => Str::headline($this->status),
            'icon' => match (Str::lower($this->status)) {
                'resolved' => IncidentStatusIcon::CircleCheck->value,
                'unresolved' => IncidentStatusIcon::CircleAlert->value,
                default => IncidentStatusIcon::Clock->value,
            },
        ];
    }

    public function conversationIsOpen(): bool
    {
        return $this->managedStatusDefinition()['icon'] === IncidentStatusIcon::Clock->value;
    }

    /** @return array{name: string, icon: string} */
    private function normalizedManagedStatusDefinition(string $name, string $icon): array
    {
        return ['name' => $name, 'icon' => $icon];
    }

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'report_data' => 'array',
        ];
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
