<?php

namespace App\Models;

use App\Enums\IncidentStatusIcon;
use Database\Factories\IncidentStatusFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $incident_subcategory_id
 * @property string $name
 * @property IncidentStatusIcon $icon
 * @property int $sort_order
 * @property-read IncidentSubcategory $subcategory
 */
#[Fillable(['name', 'icon', 'sort_order'])]
class IncidentStatus extends Model
{
    /** @use HasFactory<IncidentStatusFactory> */
    use HasFactory, HasUlids;

    /** @return array<int, array{name: string, icon: 'circle-check'|'clock'|'circle-alert'}> */
    public static function defaults(): array
    {
        return [
            ['name' => 'Resolved', 'icon' => IncidentStatusIcon::CircleCheck->value],
            ['name' => 'Pending', 'icon' => IncidentStatusIcon::Clock->value],
            ['name' => 'Unresolved', 'icon' => IncidentStatusIcon::CircleAlert->value],
        ];
    }

    /** @return BelongsTo<IncidentSubcategory, $this> */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(IncidentSubcategory::class, 'incident_subcategory_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['icon' => IncidentStatusIcon::class];
    }
}
