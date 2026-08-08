<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateIncidentStatusesRequest;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IncidentStatusController extends Controller
{
    public function update(
        UpdateIncidentStatusesRequest $request,
        IncidentType $incidentType,
        IncidentSubcategory $subcategory,
    ): RedirectResponse {
        DB::transaction(function () use ($request, $subcategory): void {
            $subcategory->statuses()->delete();
            $subcategory->statuses()->createMany(
                collect($request->validated('statuses'))
                    ->values()
                    ->map(fn (array $status, int $index): array => [
                        ...$status,
                        'sort_order' => $index,
                    ])
                    ->all(),
            );
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Statuses saved.')]);

        return to_route('form-management.index', [
            'incident_type' => $incidentType->id,
            'subcategory' => $subcategory->id,
        ]);
    }
}
