<?php

namespace App\Http\Requests;

use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncidentSubcategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $incidentType = $this->route('incident_type');

        return $incidentType instanceof IncidentType
            && $this->user() !== null
            && $this->user()->can('manage-forms')
            && $this->user()->canAccessRegion($incidentType->region_id);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'names' => ['required', 'array', 'min:1', 'max:25'],
            'names.*' => [
                'required',
                'string',
                'max:255',
                'distinct:ignore_case',
                Rule::unique(IncidentSubcategory::class, 'name')->where(
                    'incident_type_id',
                    $this->route('incident_type') instanceof IncidentType
                        ? $this->route('incident_type')->id
                        : $this->route('incident_type'),
                ),
            ],
        ];
    }
}
