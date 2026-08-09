<?php

namespace App\Http\Requests;

use App\Models\Incident;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $incident = $this->route('incident');

        return $incident instanceof Incident
            && $incident->region_id === $this->user()?->region_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $incident = $this->route('incident');
        $allowedStatuses = $incident instanceof Incident
            ? $incident->managedStatusDefinitions()->pluck('name')->all()
            : [];

        return [
            'status' => ['required', 'string', Rule::in($allowedStatuses)],
        ];
    }
}
