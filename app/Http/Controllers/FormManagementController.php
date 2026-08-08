<?php

namespace App\Http\Controllers;

use App\Enums\FormFieldType;
use App\Models\IncidentForm;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $regionId = $request->user()?->region_id;
        $incidentTypes = IncidentType::query()
            ->select('id', 'name')
            ->with([
                'subcategories:id,incident_type_id,name',
                'subcategories.statuses:id,incident_subcategory_id,name,icon,sort_order',
                'subcategories.form' => function (HasOne $query) use ($regionId): void {
                    $query
                        ->select('id', 'incident_subcategory_id', 'region_id', 'title', 'description')
                        ->where('region_id', $regionId);
                },
                'subcategories.form.sections:id,incident_form_id,title,description,sort_order',
                'subcategories.form.sections.fields:id,form_section_id,type,label,description,placeholder,is_required,sort_order',
                'subcategories.form.sections.fields.options:id,form_field_id,label,value,sort_order',
            ])
            ->orderBy('name')
            ->get()
            ->each(function (IncidentType $incidentType): void {
                $incidentType->subcategories->each(function (IncidentSubcategory $subcategory): void {
                    if ($subcategory->statuses->isEmpty()) {
                        $subcategory->setRelation('statuses', collect(IncidentStatus::defaults()));
                    }
                });
            });

        $selectedIncidentTypeId = $request->string('incident_type')->toString();
        $selectedSubcategoryId = $request->string('subcategory')->toString();
        $selectedIncidentType = $incidentTypes->firstWhere('id', $selectedIncidentTypeId);
        $hasValidIncidentType = $selectedIncidentType !== null;
        $hasValidSelection = $selectedIncidentType?->subcategories
            ->contains('id', $selectedSubcategoryId) ?? false;

        return Inertia::render('form-management/index', [
            'incidentTypes' => $incidentTypes,
            'savedForms' => IncidentForm::query()
                ->select('id', 'incident_subcategory_id', 'created_at')
                ->where('region_id', $regionId)
                ->with([
                    'subcategory:id,incident_type_id,name',
                    'subcategory.incidentType:id,name',
                ])
                ->when($hasValidIncidentType, function (Builder $query) use ($selectedIncidentTypeId): void {
                    $query->whereHas('subcategory', function (Builder $subcategoryQuery) use ($selectedIncidentTypeId): void {
                        $subcategoryQuery->where('incident_type_id', $selectedIncidentTypeId);
                    });
                })
                ->when($search !== '', function (Builder $query) use ($search): void {
                    $query->whereHas('subcategory', function (Builder $subcategoryQuery) use ($search): void {
                        $subcategoryQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhereHas('incidentType', function (Builder $incidentTypeQuery) use ($search): void {
                                $incidentTypeQuery->where('name', 'like', "%{$search}%");
                            });
                    });
                })
                ->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn (IncidentForm $form): array => [
                    'id' => $form->id,
                    'incident_type_id' => $form->subcategory->incident_type_id,
                    'incident_type_name' => $form->subcategory->incidentType->name,
                    'subcategory_id' => $form->incident_subcategory_id,
                    'subcategory_name' => $form->subcategory->name,
                    'created_at' => $form->created_at->toIso8601String(),
                    'created_at_display' => $form->created_at->format('M d, Y · h:i A'),
                ]),
            'filters' => [
                'search' => $search,
            ],
            'selection' => [
                'incident_type_id' => $hasValidIncidentType ? $selectedIncidentTypeId : null,
                'subcategory_id' => $hasValidSelection ? $selectedSubcategoryId : null,
            ],
            'fieldTypes' => collect(FormFieldType::cases())->map(fn (FormFieldType $type): array => [
                'value' => $type->value,
                'label' => Str::headline($type->name),
            ]),
        ]);
    }
}
