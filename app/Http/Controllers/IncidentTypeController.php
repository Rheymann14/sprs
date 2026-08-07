<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncidentTypeRequest;
use App\Http\Requests\UpdateIncidentTypeRequest;
use App\Models\IncidentType;
use Illuminate\Http\RedirectResponse;

class IncidentTypeController extends Controller
{
    public function store(StoreIncidentTypeRequest $request): RedirectResponse
    {
        IncidentType::query()->create($request->validated());

        return to_route('form-management.index');
    }

    public function update(UpdateIncidentTypeRequest $request, IncidentType $incidentType): RedirectResponse
    {
        $incidentType->update($request->validated());

        return to_route('form-management.index');
    }

    public function destroy(IncidentType $incidentType): RedirectResponse
    {
        $incidentType->delete();

        return to_route('form-management.index');
    }
}
