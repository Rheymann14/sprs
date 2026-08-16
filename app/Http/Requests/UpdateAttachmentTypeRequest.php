<?php

namespace App\Http\Requests;

use App\Models\AttachmentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttachmentTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $attachmentType = $this->route('attachment_type');

        return $attachmentType instanceof AttachmentType
            && $this->user() !== null
            && $this->user()->can('manage-forms')
            && $this->user()->canAccessRegion($attachmentType->region_id);
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
                Rule::unique(AttachmentType::class)
                    ->where('region_id', $this->route('attachment_type')->region_id)
                    ->ignore($this->route('attachment_type')),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['name' => $this->string('name')->trim()->toString()]);
    }
}
