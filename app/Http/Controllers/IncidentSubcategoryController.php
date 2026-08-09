<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncidentSubcategoryRequest;
use App\Http\Requests\UpdateIncidentSubcategoryRequest;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncidentSubcategoryController extends Controller
{
    public function store(StoreIncidentSubcategoryRequest $request, IncidentType $incidentType): RedirectResponse
    {
        $incidentType->subcategories()->createMany(
            collect($request->validated('names'))
                ->map(fn (string $name): array => [
                    'region_id' => $incidentType->region_id,
                    'name' => $name,
                ])
                ->all(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subcategories created.')]);

        return to_route('form-management.index', ['region_id' => $incidentType->region_id]);
    }

    public function update(
        UpdateIncidentSubcategoryRequest $request,
        IncidentType $incidentType,
        IncidentSubcategory $subcategory,
    ): RedirectResponse {
        $subcategory->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subcategory updated.')]);

        return to_route('form-management.index', ['region_id' => $incidentType->region_id]);
    }

    public function destroy(
        Request $request,
        IncidentType $incidentType,
        IncidentSubcategory $subcategory,
    ): RedirectResponse {
        abort_unless(
            $subcategory->incident_type_id === $incidentType->id
                && $subcategory->region_id === $incidentType->region_id
                && $request->user()->canAccessRegion($incidentType->region_id),
            403,
        );

        $subcategory->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subcategory deleted.')]);

        return to_route('form-management.index', ['region_id' => $incidentType->region_id]);
    }
}
