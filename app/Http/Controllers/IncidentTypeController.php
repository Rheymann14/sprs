<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncidentTypeRequest;
use App\Http\Requests\UpdateIncidentTypeRequest;
use App\Models\IncidentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncidentTypeController extends Controller
{
    public function store(StoreIncidentTypeRequest $request): RedirectResponse
    {
        IncidentType::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident type created.')]);

        return to_route('form-management.index', ['region_id' => $request->validated('region_id')]);
    }

    public function update(UpdateIncidentTypeRequest $request, IncidentType $incidentType): RedirectResponse
    {
        $incidentType->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident type updated.')]);

        return to_route('form-management.index', ['region_id' => $incidentType->region_id]);
    }

    public function destroy(Request $request, IncidentType $incidentType): RedirectResponse
    {
        abort_unless($request->user()->canAccessRegion($incidentType->region_id), 403);

        $incidentType->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident type deleted.')]);

        return to_route('form-management.index', ['region_id' => $incidentType->region_id]);
    }
}
