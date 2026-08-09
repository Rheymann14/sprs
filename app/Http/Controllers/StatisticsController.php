<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $requestedRegionId = $request->string('region_id')->trim()->toString();
        $regionId = $user->isSuperAdmin()
            ? Region::query()->whereKey($requestedRegionId)->value('id')
            : $user->region_id;
        $yearExpression = match (DB::connection()->getDriverName()) {
            'sqlite' => "CAST(strftime('%Y', created_at) AS INTEGER)",
            'pgsql' => 'EXTRACT(YEAR FROM created_at)::INTEGER',
            default => 'YEAR(created_at)',
        };

        $incidentCounts = Incident::query()
            ->select('incident_subcategory_id', 'status')
            ->selectRaw("{$yearExpression} as year")
            ->selectRaw('COUNT(*) as incident_count')
            ->when($regionId !== null, fn ($query) => $query->where('region_id', $regionId))
            ->groupBy('incident_subcategory_id', 'status')
            ->groupByRaw($yearExpression)
            ->get();

        $subcategories = IncidentSubcategory::query()
            ->select('id', 'incident_type_id', 'name')
            ->whereIn('id', $incidentCounts->pluck('incident_subcategory_id')->unique())
            ->with([
                'incidentType:id,name',
                'statuses:id,incident_subcategory_id,name,icon,sort_order',
            ])
            ->get()
            ->keyBy('id');

        $rows = $incidentCounts
            ->groupBy(fn (Incident $incident): string => "{$incident->year}:{$incident->incident_subcategory_id}")
            ->map(function (Collection $counts) use ($subcategories): ?array {
                /** @var Incident $firstCount */
                $firstCount = $counts->first();
                $subcategory = $subcategories->get($firstCount->incident_subcategory_id);

                if ($subcategory === null) {
                    return null;
                }

                $statusDefinitions = $subcategory->statuses->isEmpty()
                    ? collect(IncidentStatus::defaults())
                    : $subcategory->statuses->map(fn (IncidentStatus $status): array => [
                        'name' => $status->name,
                        'icon' => $status->icon->value,
                    ]);

                return [
                    'year' => (int) $firstCount->year,
                    'incident_type_id' => $subcategory->incident_type_id,
                    'incident_type' => $subcategory->incidentType->name,
                    'subcategory_id' => $subcategory->id,
                    'subcategory' => $subcategory->name,
                    'total' => (int) $counts->sum('incident_count'),
                    'status_counts' => $statusDefinitions->map(function (array $status) use ($counts): array {
                        $count = $counts->first(
                            fn (Incident $incident): bool => Str::lower($incident->status) === Str::lower($status['name']),
                        );

                        return [
                            ...$status,
                            'count' => (int) ($count?->incident_count ?? 0),
                        ];
                    })->values()->all(),
                ];
            })
            ->filter()
            ->sortBy([
                ['year', 'desc'],
                ['incident_type', 'asc'],
                ['subcategory', 'asc'],
            ])
            ->values();

        $statusCounts = $rows
            ->flatMap(fn (array $row): array => $row['status_counts'])
            ->groupBy(fn (array $status): string => Str::lower($status['name']))
            ->map(fn (Collection $statuses): array => [
                'name' => $statuses->first()['name'],
                'icon' => $statuses->first()['icon'],
                'count' => $statuses->sum('count'),
            ])
            ->values();

        return Inertia::render('statistics', [
            'statistics' => [
                'total' => $rows->sum('total'),
                'status_counts' => $statusCounts,
                'rows' => $rows,
            ],
            'filters' => [
                'region_id' => $regionId ?? '',
            ],
            'regions' => $user->isSuperAdmin()
                ? Region::query()->select('id', 'name')->orderBy('name')->get()
                : [],
        ]);
    }
}
