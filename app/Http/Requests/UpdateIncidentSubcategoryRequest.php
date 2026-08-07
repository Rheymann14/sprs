<?php

namespace App\Http\Requests;

use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentSubcategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage-forms') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(IncidentSubcategory::class)
                    ->where(
                        'incident_type_id',
                        $this->route('incident_type') instanceof IncidentType
                            ? $this->route('incident_type')->id
                            : $this->route('incident_type'),
                    )
                    ->ignore($this->route('subcategory')),
            ],
        ];
    }
}
