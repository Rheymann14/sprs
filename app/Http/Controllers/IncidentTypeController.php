<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncidentTypeRequest;
use App\Http\Requests\UpdateIncidentTypeRequest;
use App\Models\IncidentType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class IncidentTypeController extends Controller
{
    public function store(StoreIncidentTypeRequest $request): RedirectResponse
    {
        IncidentType::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident type created.')]);

        return to_route('form-management.index');
    }

    public function update(UpdateIncidentTypeRequest $request, IncidentType $incidentType): RedirectResponse
    {
        $incidentType->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident type updated.')]);

        return to_route('form-management.index');
    }

    public function destroy(IncidentType $incidentType): RedirectResponse
    {
        $incidentType->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident type deleted.')]);

        return to_route('form-management.index');
    }
}
