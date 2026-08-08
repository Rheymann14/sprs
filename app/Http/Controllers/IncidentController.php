<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        return Inertia::render('incidents/index', [
            'incidents' => Incident::query()
                ->select('id', 'incident_number', 'incident_subcategory_id', 'status', 'created_at')
                ->where('region_id', $request->user()?->region_id)
                ->with([
                    'subcategory:id,incident_type_id,name',
                    'subcategory.incidentType:id,name',
                ])
                ->when($search !== '', function (Builder $query) use ($search): void {
                    $query->where(function (Builder $searchQuery) use ($search): void {
                        $searchQuery
                            ->where('incident_number', 'like', "%{$search}%")
                            ->orWhere('status', 'like', "%{$search}%")
                            ->orWhereHas('subcategory', function (Builder $subcategoryQuery) use ($search): void {
                                $subcategoryQuery
                                    ->where('name', 'like', "%{$search}%")
                                    ->orWhereHas('incidentType', function (Builder $incidentTypeQuery) use ($search): void {
                                        $incidentTypeQuery->where('name', 'like', "%{$search}%");
                                    });
                            });
                    });
                })
                ->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn (Incident $incident): array => [
                    'id' => $incident->id,
                    'incident_number' => $incident->incident_number,
                    'incident_type' => $incident->subcategory->incidentType->name,
                    'subcategory' => $incident->subcategory->name,
                    'status' => $incident->status,
                    'status_label' => Str::headline($incident->status),
                ]),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}
