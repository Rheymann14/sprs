<?php

namespace App\Models;

use Database\Factories\FormSectionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $incident_form_id
 * @property string $title
 * @property string|null $description
 * @property int $sort_order
 * @property-read IncidentForm $form
 * @property-read Collection<int, FormField> $fields
 */
#[Fillable(['title', 'description', 'sort_order'])]
class FormSection extends Model
{
    /** @use HasFactory<FormSectionFactory> */
    use HasFactory, HasUlids;

    /**
     * @return BelongsTo<IncidentForm, $this>
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(IncidentForm::class, 'incident_form_id');
    }

    /**
     * @return HasMany<FormField, $this>
     */
    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class)->orderBy('sort_order');
    }
}
