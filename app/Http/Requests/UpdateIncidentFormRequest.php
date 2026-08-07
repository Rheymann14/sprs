<?php

namespace App\Http\Requests;

use App\Enums\FormFieldType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateIncidentFormRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*' => ['array:client_key,title,description,fields'],
            'sections.*.client_key' => ['required', 'uuid'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.description' => ['nullable', 'string', 'max:5000'],
            'sections.*.fields' => ['present', 'array'],
            'sections.*.fields.*' => ['array:client_key,type,label,description,placeholder,is_required,options'],
            'sections.*.fields.*.client_key' => ['required', 'uuid'],
            'sections.*.fields.*.type' => ['required', Rule::enum(FormFieldType::class)],
            'sections.*.fields.*.label' => ['required', 'string', 'max:255'],
            'sections.*.fields.*.description' => ['nullable', 'string', 'max:2000'],
            'sections.*.fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'sections.*.fields.*.is_required' => ['required', 'boolean'],
            'sections.*.fields.*.options' => ['present', 'array'],
            'sections.*.fields.*.options.*' => ['required', 'string', 'max:255', 'distinct:ignore_case'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach ($this->array('sections') as $sectionIndex => $section) {
                    foreach ($section['fields'] ?? [] as $fieldIndex => $field) {
                        if (! in_array($field['type'] ?? null, [FormFieldType::Dropdown->value, FormFieldType::Radio->value], true)) {
                            continue;
                        }

                        if (count($field['options'] ?? []) < 2) {
                            $validator->errors()->add(
                                "sections.$sectionIndex.fields.$fieldIndex.options",
                                'Dropdown and radio fields require at least two options.',
                            );
                        }
                    }
                }
            },
        ];
    }
}
