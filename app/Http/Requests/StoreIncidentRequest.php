<?php

namespace App\Http\Requests;

use App\Enums\FormFieldType;
use App\Models\IncidentForm;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class StoreIncidentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'incident_subcategory_id' => ['required', 'string', Rule::exists('incident_subcategories', 'id')],
            'responses' => ['nullable', 'array'],
        ];

        $form = $this->incidentForm();

        if ($form === null) {
            return $rules;
        }

        $fieldIds = $form->sections
            ->flatMap->fields
            ->pluck('id')
            ->all();

        $rules['responses'] = $fieldIds === []
            ? ['nullable', 'array', 'max:0']
            : ['nullable', 'array:'.implode(',', $fieldIds)];

        foreach ($form->sections->flatMap->fields as $field) {
            $fieldRules = match ($field->type) {
                FormFieldType::Text => ['string', 'max:1000'],
                FormFieldType::Number => ['numeric'],
                FormFieldType::DateTime => ['date'],
                FormFieldType::Textarea => ['string', 'max:10000'],
                FormFieldType::Dropdown, FormFieldType::Radio => [
                    'string',
                    Rule::in($field->options->pluck('value')->all()),
                ],
                FormFieldType::File => [File::types(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])->max(10 * 1024)],
                FormFieldType::Checkbox => ['boolean'],
            };

            array_unshift(
                $fieldRules,
                $field->is_required
                    ? ($field->type === FormFieldType::Checkbox ? 'accepted' : 'required')
                    : 'nullable',
            );

            $rules["responses.{$field->id}"] = $fieldRules;
        }

        return $rules;
    }

    public function incidentForm(): ?IncidentForm
    {
        return once(function (): ?IncidentForm {
            $subcategoryId = $this->input('incident_subcategory_id');

            if (! is_string($subcategoryId) || $this->user()?->region_id === null) {
                return null;
            }

            return IncidentForm::query()
                ->select('id', 'incident_subcategory_id', 'region_id', 'title', 'description')
                ->where('incident_subcategory_id', $subcategoryId)
                ->where('region_id', $this->user()->region_id)
                ->with([
                    'subcategory:id',
                    'subcategory.statuses:id,incident_subcategory_id,name,icon,sort_order',
                    'sections:id,incident_form_id,title,description,sort_order',
                    'sections.fields:id,form_section_id,type,label,description,placeholder,is_required,sort_order',
                    'sections.fields.options:id,form_field_id,label,value,sort_order',
                ])
                ->first();
        });
    }

    /**
     * @return array<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->user()?->region_id === null) {
                    $validator->errors()->add('incident_subcategory_id', __('Your account must be assigned to a region before filing a report.'));

                    return;
                }

                if ($this->incidentForm() === null) {
                    $validator->errors()->add('incident_subcategory_id', __('Select a subcategory with an available report form.'));
                }
            },
        ];
    }
}
