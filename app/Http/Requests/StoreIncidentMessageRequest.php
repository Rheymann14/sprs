<?php

namespace App\Http\Requests;

use App\Models\Incident;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreIncidentMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $incident = $this->route('incident');

        return $incident instanceof Incident
            && ($this->user()?->canAccessRegion($incident->region_id) ?? false)
            && $incident->conversationIsOpen();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['nullable', 'string', 'max:5000', 'required_without:attachments'],
            'attachments' => ['nullable', 'array', 'max:5', 'required_without:message'],
            'attachments.*' => [
                'file',
                File::types(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])->max(5 * 1024),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $message = $this->input('message');

        if (is_string($message)) {
            $this->merge(['message' => str($message)->trim()->toString() ?: null]);
        }
    }
}
