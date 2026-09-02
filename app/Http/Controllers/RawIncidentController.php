<?php

namespace App\Http\Controllers;

use App\Enums\FormFieldType;
use App\Http\Requests\RawIncidentIndexRequest;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RawIncidentController extends Controller
{
    public function index(RawIncidentIndexRequest $request): Response
    {
        $filters = $request->validated();
        $incidentTypeId = $filters['incident_type_id'] ?? '';
        $subcategoryId = $filters['subcategory_id'] ?? '';
        $dateFrom = $filters['date_from'] ?? '';
        $dateTo = $filters['date_to'] ?? '';

        $incidents = $this->accessibleIncidents($request->user())
            ->select('id', 'incident_number', 'incident_subcategory_id', 'region_id', 'status', 'created_at')
            ->with([
                'region:id,name',
                'subcategory:id,incident_type_id,name',
                'subcategory.incidentType:id,name',
            ])
            ->when($dateFrom !== '', fn (Builder $query) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo !== '', fn (Builder $query) => $query->whereDate('created_at', '<=', $dateTo))
            ->when($incidentTypeId !== '', function (Builder $query) use ($incidentTypeId): void {
                $query->whereHas(
                    'subcategory',
                    fn (Builder $subcategoryQuery) => $subcategoryQuery->where('incident_type_id', $incidentTypeId),
                );
            })
            ->when($subcategoryId !== '', fn (Builder $query) => $query->where('incident_subcategory_id', $subcategoryId))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Incident $incident): array => [
                'id' => $incident->id,
                'incident_number' => $incident->incident_number,
                'incident_type' => $incident->subcategory->incidentType->name,
                'subcategory' => $incident->subcategory->name,
                'region' => $incident->region->name,
                'status' => $incident->status,
                'created_at' => $incident->created_at?->toIso8601String(),
            ]);

        return Inertia::render('raw-list/index', [
            'incidents' => $incidents,
            'incidentTypes' => $this->incidentTypesForAccessibleIncidents($request->user()),
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'incident_type_id' => $incidentTypeId,
                'subcategory_id' => $subcategoryId,
            ],
        ]);
    }

    public function show(Request $request, Incident $incident): Response
    {
        abort_unless($incident->isAccessibleBy($request->user()), 403);

        $incident->load([
            'region:id,name',
            'subcategory:id,incident_type_id,name',
            'subcategory.incidentType:id,name',
        ]);

        return Inertia::render('raw-list/show', [
            'incident' => [
                'id' => $incident->id,
                'incident_number' => $incident->incident_number,
                'incident_type' => $incident->subcategory->incidentType->name,
                'subcategory' => $incident->subcategory->name,
                'region' => $incident->region->name,
                'status' => $incident->status,
                'created_at' => $incident->created_at?->toIso8601String(),
                'report_title' => data_get($incident->report_data, 'title', 'Incident report'),
                'report_description' => data_get($incident->report_data, 'description'),
                'report_sections' => $this->reportSections($incident->report_data),
            ],
        ]);
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
            ->with(['subcategories' => function (HasMany $query) use ($subcategoryIds): void {
                $query
                    ->select('id', 'incident_type_id', 'name')
                    ->whereIn('id', clone $subcategoryIds)
                    ->orderBy('name');
            }])
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array<string, mixed>|null  $reportData
     * @return array<int, array<string, mixed>>
     */
    private function reportSections(?array $reportData): array
    {
        $sections = $reportData['sections'] ?? null;

        if (! is_array($sections)) {
            return [];
        }

        return collect($sections)
            ->filter(fn (mixed $section): bool => is_array($section))
            ->map(function (array $section): array {
                return [
                    'title' => is_string($section['title'] ?? null) ? $section['title'] : null,
                    'description' => is_string($section['description'] ?? null) ? $section['description'] : null,
                    'fields' => collect($section['fields'] ?? [])
                        ->filter(fn (mixed $field): bool => is_array($field))
                        ->map(fn (array $field): array => $this->reportField($field))
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $field
     * @return array{label: string, value: string, attachment: array{name: string, url: string}|null}
     */
    private function reportField(array $field): array
    {
        $value = $field['display_value'] ?? $field['value'] ?? null;
        $attachment = null;

        if (($field['type'] ?? null) === FormFieldType::File->value && is_array($value)) {
            $path = $value['path'] ?? null;
            $name = $value['name'] ?? null;

            if (is_string($path)) {
                $attachment = [
                    'name' => is_string($name) ? $name : basename($path),
                    'url' => $this->reportAttachmentUrl($path),
                ];
            }

            $value = $attachment['name'] ?? null;
        } elseif (is_bool($value)) {
            $value = $value ? __('Yes') : __('No');
        } elseif (is_array($value)) {
            $value = collect($value)->filter(fn (mixed $item): bool => is_scalar($item))->implode(', ');
        }

        return [
            'label' => is_string($field['label'] ?? null) ? $field['label'] : __('Untitled field'),
            'value' => filled($value) ? (string) $value : '—',
            'attachment' => $attachment,
        ];
    }

    private function reportAttachmentUrl(string $path): string
    {
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->url($path);
        }

        return Storage::disk('local')->temporaryUrl($path, now()->addMinutes(30));
    }
}
