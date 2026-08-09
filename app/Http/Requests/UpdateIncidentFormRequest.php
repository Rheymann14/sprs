<?php

namespace App\Http\Requests;

use App\Enums\FormFieldType;
use App\Models\Region;
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
        return $this->user()?->region_id !== null
            && $this->user()->can('manage-forms');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $regionRules = ['required', 'string', Rule::exists(Region::class, 'id')];

        if (! $this->user()->isSuperAdmin()) {
            $regionRules[] = Rule::in([$this->user()->region_id]);
        }

        return [
            'region_id' => $regionRules,
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
     * Get custom validation messages for the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Enter a form title.',
            'title.max' => 'The form title must be 255 characters or fewer.',
            'description.max' => 'The form description must be 5,000 characters or fewer.',
            'sections.required' => 'Add at least one section to the form.',
            'sections.array' => 'The form sections could not be read. Refresh the page and try again.',
            'sections.min' => 'Add at least one section to the form.',
            'sections.*.array' => 'Some section information could not be read. Refresh the page and try again.',
            'sections.*.client_key.required' => 'A section could not be identified. Refresh the page and try again.',
            'sections.*.client_key.uuid' => 'A section could not be identified. Refresh the page and try again.',
            'sections.*.title.required' => 'Enter a title for each section.',
            'sections.*.title.max' => 'Section titles must be 255 characters or fewer.',
            'sections.*.description.max' => 'Section descriptions must be 5,000 characters or fewer.',
            'sections.*.fields.present' => 'A section is missing its fields. Refresh the page and try again.',
            'sections.*.fields.array' => 'A section contains invalid fields. Refresh the page and try again.',
            'sections.*.fields.*.array' => 'Some field information could not be read. Refresh the page and try again.',
            'sections.*.fields.*.client_key.required' => 'A field could not be identified. Refresh the page and try again.',
            'sections.*.fields.*.client_key.uuid' => 'A field could not be identified. Refresh the page and try again.',
            'sections.*.fields.*.type.required' => 'Choose a type for each field.',
            'sections.*.fields.*.type.enum' => 'Choose a valid field type.',
            'sections.*.fields.*.label.required' => 'Enter a label for each field.',
            'sections.*.fields.*.label.max' => 'Field labels must be 255 characters or fewer.',
            'sections.*.fields.*.description.max' => 'Field help text must be 2,000 characters or fewer.',
            'sections.*.fields.*.placeholder.max' => 'Field placeholders must be 255 characters or fewer.',
            'sections.*.fields.*.is_required.required' => 'Choose whether each field is required.',
            'sections.*.fields.*.is_required.boolean' => 'Choose whether each field is required.',
            'sections.*.fields.*.options.present' => 'Add the available choices for this field.',
            'sections.*.fields.*.options.array' => 'The choices for a field could not be read. Refresh the page and try again.',
            'sections.*.fields.*.options.*.required' => 'Fill in every field option.',
            'sections.*.fields.*.options.*.max' => 'Field options must be 255 characters or fewer.',
            'sections.*.fields.*.options.*.distinct' => 'Each field option must be unique.',
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
