<?php

namespace App\Models;

use Database\Factories\FormFieldOptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $form_field_id
 * @property string $label
 * @property string $value
 * @property int $sort_order
 * @property-read FormField $field
 */
#[Fillable(['label', 'value', 'sort_order'])]
class FormFieldOption extends Model
{
    /** @use HasFactory<FormFieldOptionFactory> */
    use HasFactory, HasUlids;

    /**
     * @return BelongsTo<FormField, $this>
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(FormField::class, 'form_field_id');
    }
}
