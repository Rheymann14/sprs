<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateIncidentStatusesRequest;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class IncidentStatusController extends Controller
{
    public function update(
        UpdateIncidentStatusesRequest $request,
        IncidentType $incidentType,
        IncidentSubcategory $subcategory,
    ): RedirectResponse {
        DB::transaction(function () use ($request, $subcategory): void {
            $previousStatuses = $subcategory->statuses()
                ->get(['name', 'icon', 'sort_order'])
                ->map(fn (IncidentStatus $status): array => [
                    'name' => $status->name,
                    'icon' => $status->icon->value,
                ]);

            if ($previousStatuses->isEmpty()) {
                $previousStatuses = collect(IncidentStatus::defaults());
            }

            $newStatuses = collect($request->validated('statuses'))->values();

            $subcategory->statuses()->delete();
            $subcategory->statuses()->createMany(
                $newStatuses
                    ->values()
                    ->map(fn (array $status, int $index): array => [
                        ...$status,
                        'sort_order' => $index,
                    ])
                    ->all(),
            );

            $previousStatuses->each(function (array $previousStatus, int $index) use ($newStatuses, $subcategory): void {
                $replacement = $newStatuses->firstWhere('icon', $previousStatus['icon'])
                    ?? $newStatuses->get($index)
                    ?? $newStatuses->first();

                $subcategory->incidents()
                    ->whereRaw('LOWER(status) = ?', [Str::lower($previousStatus['name'])])
                    ->update(['status' => $replacement['name']]);
            });
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Statuses saved.')]);

        return to_route('form-management.index', [
            'region_id' => $incidentType->region_id,
            'incident_type' => $incidentType->id,
            'subcategory' => $subcategory->id,
        ]);
    }
}
