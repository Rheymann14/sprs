<?php

namespace App\Http\Controllers;

use App\Enums\FormFieldType;
use App\Models\IncidentType;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('form-management/index', [
            'incidentTypes' => IncidentType::query()
                ->select('id', 'name')
                ->with([
                    'subcategories:id,incident_type_id,name',
                    'subcategories.form:id,incident_subcategory_id,title,description',
                    'subcategories.form.sections:id,incident_form_id,title,description,sort_order',
                    'subcategories.form.sections.fields:id,form_section_id,type,label,description,placeholder,is_required,sort_order',
                    'subcategories.form.sections.fields.options:id,form_field_id,label,value,sort_order',
                ])
                ->orderBy('name')
                ->get(),
            'fieldTypes' => collect(FormFieldType::cases())->map(fn (FormFieldType $type): array => [
                'value' => $type->value,
                'label' => Str::headline($type->name),
            ]),
        ]);
    }
}
