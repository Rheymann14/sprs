<?php

namespace App\Models;

use App\Enums\FormFieldType;
use Database\Factories\FormFieldFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $form_section_id
 * @property FormFieldType $type
 * @property string $label
 * @property string|null $description
 * @property string|null $placeholder
 * @property bool $is_required
 * @property int $sort_order
 * @property-read FormSection $section
 * @property-read Collection<int, FormFieldOption> $options
 */
#[Fillable(['type', 'label', 'description', 'placeholder', 'is_required', 'sort_order'])]
class FormField extends Model
{
    /** @use HasFactory<FormFieldFactory> */
    use HasFactory, HasUlids;

    /**
     * @return BelongsTo<FormSection, $this>
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(FormSection::class, 'form_section_id');
    }

    /**
     * @return HasMany<FormFieldOption, $this>
     */
    public function options(): HasMany
    {
        return $this->hasMany(FormFieldOption::class)->orderBy('sort_order');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => FormFieldType::class,
            'is_required' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
