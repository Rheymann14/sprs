<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateIncidentRoutingRequest;
use App\Models\Incident;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class IncidentRoutingController extends Controller
{
    public function update(UpdateIncidentRoutingRequest $request, Incident $incident): RedirectResponse
    {
        $incident->routedRegions()->sync($request->validated('region_ids'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident routing updated.')]);

        return back();
    }
}
