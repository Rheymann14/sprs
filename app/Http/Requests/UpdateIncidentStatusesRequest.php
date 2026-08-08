<?php

namespace App\Http\Requests;

use App\Enums\IncidentStatusIcon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentStatusesRequest extends FormRequest
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
            'statuses' => ['required', 'array', 'min:1', 'max:3'],
            'statuses.*' => ['array:name,icon'],
            'statuses.*.name' => ['required', 'string', 'max:32', 'distinct:ignore_case'],
            'statuses.*.icon' => ['required', Rule::enum(IncidentStatusIcon::class)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'statuses.min' => 'Add at least one status.',
            'statuses.max' => 'You can add up to three statuses.',
            'statuses.*.name.required' => 'Enter a name for each status.',
            'statuses.*.name.max' => 'Status names must be 32 characters or fewer.',
            'statuses.*.name.distinct' => 'Each status name must be unique.',
            'statuses.*.icon.required' => 'Choose an icon for each status.',
            'statuses.*.icon.enum' => 'Choose a valid status icon.',
        ];
    }
}
