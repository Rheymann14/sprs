<?php

namespace App\Http\Requests;

use App\Models\IncidentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentTypeRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(IncidentType::class)
                    ->where('region_id', $this->route('incident_type')->region_id)
                    ->ignore($this->route('incident_type')),
            ],
        ];
    }
}
