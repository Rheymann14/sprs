<?php

namespace App\Http\Requests;

use App\Enums\FormFieldType;
use App\Models\Incident;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateIncidentRequest extends StoreIncidentRequest
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

    public function rules(): array
    {
        /** @var Incident $incident */
        $incident = $this->route('incident');
        $rules = parent::rules();
        $rules['incident_subcategory_id'] = [
            'required',
            'string',
            Rule::in([$incident->incident_subcategory_id]),
        ];

        $existingResponses = collect(data_get($incident->report_data, 'sections', []))
            ->flatMap(fn (array $section): array => $section['fields'] ?? [])
            ->keyBy('field_id');

        $this->incidentForm()?->sections->flatMap->fields
            ->filter(fn ($field): bool => $field->type === FormFieldType::File)
            ->each(function ($field) use (&$rules, $existingResponses): void {
                $existingValue = $existingResponses->get($field->id)['value'] ?? null;

                if (is_array($existingValue) && isset($existingValue['path'])) {
                    $rules["responses.{$field->id}"] = [
                        'nullable',
                        File::types(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])->max(10 * 1024),
                    ];
                }
            });

        return $rules;
    }
}
