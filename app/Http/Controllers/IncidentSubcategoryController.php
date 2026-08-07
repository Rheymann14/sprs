<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncidentSubcategoryRequest;
use App\Http\Requests\UpdateIncidentSubcategoryRequest;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Http\RedirectResponse;

class IncidentSubcategoryController extends Controller
{
    public function store(StoreIncidentSubcategoryRequest $request, IncidentType $incidentType): RedirectResponse
    {
        $incidentType->subcategories()->createMany(
            collect($request->validated('names'))
                ->map(fn (string $name): array => ['name' => $name])
                ->all(),
        );

        return to_route('form-management.index');
    }

    public function update(
        UpdateIncidentSubcategoryRequest $request,
        IncidentType $incidentType,
        IncidentSubcategory $subcategory,
    ): RedirectResponse {
        $subcategory->update($request->validated());

        return to_route('form-management.index');
    }

    public function destroy(IncidentType $incidentType, IncidentSubcategory $subcategory): RedirectResponse
    {
        $subcategory->delete();

        return to_route('form-management.index');
    }
}
