<?php

namespace App\Http\Controllers;

use App\Enums\FormFieldType;
use App\Exports\RawIncidentWorkbook;
use App\Http\Requests\RawIncidentIndexRequest;
use App\Models\Incident;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RawIncidentController extends Controller
{
    public function __construct(private RawIncidentWorkbook $workbook) {}

    public function index(RawIncidentIndexRequest $request): Response
    {
        $filters = $this->filters($request);
        $incidents = $this->filteredIncidents($request->user(), $filters)
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Incident $incident): array => $this->incidentRow($incident));

        return Inertia::render('raw-list/index', [
            'incidents' => $incidents,
            'incidentTypes' => $this->incidentTypesForAccessibleIncidents($request->user()),
            'filters' => $filters,
        ]);
    }

    public function download(RawIncidentIndexRequest $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $incidents = $this->filteredIncidents($request->user(), $filters)
            ->get()
            ->map(fn (Incident $incident): array => $this->incidentRow($incident, includeAttachments: false))
            ->values()
            ->all();

        return response()->streamDownload(
            fn () => $this->workbook->write($incidents, 'php://output'),
            'raw-incidents-'.now()->toDateString().'.xlsx',
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'no-store, no-cache',
            ],
        );
    }

    /**
     * @param  array{date_from: string, date_to: string, incident_type_id: string, subcategory_id: string, sort_by: 'created_at'|'incident_number'|'status', sort_direction: 'asc'|'desc'}  $filters
     * @return Builder<Incident>
     */
    private function filteredIncidents(User $user, array $filters): Builder
    {
        return $this->accessibleIncidents($user)
            ->select('id', 'incident_number', 'incident_subcategory_id', 'region_id', 'status', 'report_data', 'created_at')
            ->with([
                'region:id,name',
                'subcategory:id,incident_type_id,name',
                'subcategory.incidentType:id,name',
            ])
            ->when($filters['date_from'] !== '', fn (Builder $query) => $query->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '', fn (Builder $query) => $query->whereDate('created_at', '<=', $filters['date_to']))
            ->when($filters['incident_type_id'] !== '', function (Builder $query) use ($filters): void {
                $query->whereIn(
                    'incident_subcategory_id',
                    IncidentSubcategory::query()
                        ->select('id')
                        ->where('incident_type_id', $filters['incident_type_id']),
                );
            })
            ->when(
                $filters['subcategory_id'] !== '',
                fn (Builder $query) => $query->where('incident_subcategory_id', $filters['subcategory_id']),
            )
            ->orderBy($filters['sort_by'], $filters['sort_direction'])
            ->orderByDesc('id');
    }

    /** @return Builder<Incident> */
    private function accessibleIncidents(User $user): Builder
    {
        return Incident::query()->when(
            ! $user->isSuperAdmin(),
            fn (Builder $query) => $query->where(function (Builder $accessQuery) use ($user): void {
                $accessQuery
                    ->where('region_id', $user->region_id)
                    ->orWhereHas(
                        'routedRegions',
                        fn (Builder $regionQuery) => $regionQuery->whereKey($user->region_id),
                    );
            }),
        );
    }

    /** @return Collection<int, IncidentType> */
    private function incidentTypesForAccessibleIncidents(User $user): Collection
    {
        $subcategoryIds = $this->accessibleIncidents($user)
            ->select('incident_subcategory_id')
            ->distinct();

        return IncidentType::query()
            ->select('id', 'name')
            ->whereHas(
                'subcategories',
                fn (Builder $query) => $query->whereIn('id', clone $subcategoryIds),
            )
            ->with(['subcategories' => function (Relation $relation) use ($subcategoryIds): void {
                $relation
                    ->getQuery()
                    ->select('id', 'incident_type_id', 'name')
                    ->whereIn('id', clone $subcategoryIds)
                    ->orderBy('name');
            }])
            ->orderBy('name')
            ->get();
    }

    /**
     * @return array{date_from: string, date_to: string, incident_type_id: string, subcategory_id: string, sort_by: 'created_at'|'incident_number'|'status', sort_direction: 'asc'|'desc'}
     */
    private function filters(RawIncidentIndexRequest $request): array
    {
        $validated = $request->validated();
        $sortBy = match ($validated['sort_by'] ?? null) {
            'incident_number' => 'incident_number',
            'status' => 'status',
            default => 'created_at',
        };
        $sortDirection = ($validated['sort_direction'] ?? null) === 'asc' ? 'asc' : 'desc';

        return [
            'date_from' => $validated['date_from'] ?? '',
            'date_to' => $validated['date_to'] ?? '',
            'incident_type_id' => $validated['incident_type_id'] ?? '',
            'subcategory_id' => $validated['subcategory_id'] ?? '',
            'sort_by' => $sortBy,
            'sort_direction' => $sortDirection,
        ];
    }

    /**
     * @return array{id: string, incident_number: string, incident_type: string, subcategory: string, region: string, status: string, created_at: string|null, answers: array<int, array{label: string, value: string, attachment: array{name: string, url: string, mime_type: string}|null}>, answers_text: string}
     */
    private function incidentRow(Incident $incident, bool $includeAttachments = true): array
    {
        $answers = $this->reportAnswers($incident->report_data, $includeAttachments);

        return [
            'id' => $incident->id,
            'incident_number' => $incident->incident_number,
            'incident_type' => $incident->subcategory->incidentType->name,
            'subcategory' => $incident->subcategory->name,
            'region' => $incident->region->name,
            'status' => $incident->status,
            'created_at' => $incident->created_at?->toIso8601String(),
            'answers' => $answers,
            'answers_text' => collect($answers)
                ->map(fn (array $answer): string => "{$answer['label']}: {$answer['value']}")
                ->implode("\n"),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $reportData
     * @return array<int, array{label: string, value: string, attachment: array{name: string, url: string, mime_type: string}|null}>
     */
    private function reportAnswers(?array $reportData, bool $includeAttachments): array
    {
        $sections = $reportData['sections'] ?? null;

        if (! is_array($sections)) {
            return [];
        }

        return collect($sections)
            ->filter(fn (mixed $section): bool => is_array($section))
            ->flatMap(fn (array $section): array => is_array($section['fields'] ?? null) ? $section['fields'] : [])
            ->filter(fn (mixed $field): bool => is_array($field))
            ->map(fn (array $field): array => [
                'label' => is_string($field['label'] ?? null) ? $field['label'] : __('Untitled field'),
                'value' => $this->reportValue($field),
                'attachment' => $includeAttachments ? $this->reportAttachment($field) : null,
            ])
            ->values()
            ->all();
    }

    /** @param array<string, mixed> $field */
    private function reportValue(array $field): string
    {
        $value = $field['display_value'] ?? $field['value'] ?? null;

        if (($field['type'] ?? null) === FormFieldType::File->value && is_array($value)) {
            $value = $value['name'] ?? null;
        } elseif (is_bool($value)) {
            $value = $value ? __('Yes') : __('No');
        } elseif (is_array($value)) {
            $value = collect($value)->filter(fn (mixed $item): bool => is_scalar($item))->implode(', ');
        }

        return filled($value) ? (string) $value : '—';
    }

    /**
     * @param  array<string, mixed>  $field
     * @return array{name: string, url: string, mime_type: string}|null
     */
    private function reportAttachment(array $field): ?array
    {
        $value = $field['display_value'] ?? $field['value'] ?? null;

        if (($field['type'] ?? null) !== FormFieldType::File->value || ! is_array($value)) {
            return null;
        }

        $path = $value['path'] ?? null;

        if (! is_string($path)) {
            return null;
        }

        $isPubliclyStored = Storage::disk('public')->exists($path);

        if (! $isPubliclyStored && ! Storage::disk('local')->exists($path)) {
            return null;
        }

        $disk = Storage::disk($isPubliclyStored ? 'public' : 'local');
        $name = $value['name'] ?? null;

        return [
            'name' => is_string($name) ? $name : basename($path),
            'url' => $isPubliclyStored
                ? $disk->url($path)
                : $disk->temporaryUrl($path, now()->addMinutes(30)),
            'mime_type' => $disk->mimeType($path) ?: 'application/octet-stream',
        ];
    }
}
