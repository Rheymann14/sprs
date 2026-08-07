<?php

namespace App\Http\Controllers;

use App\Enums\FormFieldType;
use App\Http\Requests\UpdateIncidentFormRequest;
use App\Models\IncidentSubcategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class IncidentFormController extends Controller
{
    public function update(UpdateIncidentFormRequest $request, IncidentSubcategory $incidentSubcategory): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($incidentSubcategory, $validated): void {
            $form = $incidentSubcategory->form()->updateOrCreate([], [
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
            ]);

            $form->sections()->delete();

            foreach ($validated['sections'] as $sectionIndex => $sectionData) {
                $section = $form->sections()->create([
                    'title' => $sectionData['title'],
                    'description' => $sectionData['description'] ?? null,
                    'sort_order' => $sectionIndex,
                ]);

                foreach ($sectionData['fields'] as $fieldIndex => $fieldData) {
                    $field = $section->fields()->create([
                        'type' => $fieldData['type'],
                        'label' => $fieldData['label'],
                        'description' => $fieldData['description'] ?? null,
                        'placeholder' => $fieldData['placeholder'] ?? null,
                        'is_required' => $fieldData['is_required'],
                        'sort_order' => $fieldIndex,
                    ]);

                    if (! in_array($fieldData['type'], [FormFieldType::Dropdown->value, FormFieldType::Radio->value], true)) {
                        continue;
                    }

                    foreach ($fieldData['options'] as $optionIndex => $optionLabel) {
                        $field->options()->create([
                            'label' => $optionLabel,
                            'value' => Str::slug($optionLabel).'-'.($optionIndex + 1),
                            'sort_order' => $optionIndex,
                        ]);
                    }
                }
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Form saved.')]);

        return to_route('form-management.index');
    }
}
