<?php

namespace App\Http\Controllers;

use App\Enums\FormFieldType;
use App\Enums\IncidentStatusIcon;
use App\Http\Requests\StoreIncidentRequest;
use App\Http\Requests\UpdateIncidentRequest;
use App\Models\Incident;
use App\Models\IncidentForm;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $year = $request->integer('year');
        $year = $year >= 1000 && $year <= 9999 ? $year : null;
        $incidentTypeId = $request->string('incident_type_id')->trim()->toString();
        $subcategoryId = $request->string('subcategory_id')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $selectedIncidentType = $incidentTypeId === ''
            ? null
            : IncidentType::query()->select('id', 'name')->find($incidentTypeId);
        $selectedSubcategory = $subcategoryId === ''
            ? null
            : IncidentSubcategory::query()
                ->select('id', 'incident_type_id', 'name')
                ->find($subcategoryId);

        return Inertia::render('incidents/index', [
            'incidents' => Incident::query()
                ->select('id', 'incident_number', 'incident_subcategory_id', 'status', 'created_at')
                ->where('region_id', $request->user()?->region_id)
                ->with([
                    'subcategory:id,incident_type_id,name',
                    'subcategory.incidentType:id,name',
                    'subcategory.statuses:id,incident_subcategory_id,name,icon,sort_order',
                ])
                ->when($year !== null, fn (Builder $query) => $query->whereYear('created_at', $year))
                ->when($incidentTypeId !== '', function (Builder $query) use ($incidentTypeId): void {
                    $query->whereIn(
                        'incident_subcategory_id',
                        IncidentSubcategory::query()
                            ->select('id')
                            ->where('incident_type_id', $incidentTypeId),
                    );
                })
                ->when($subcategoryId !== '', fn (Builder $query) => $query->where('incident_subcategory_id', $subcategoryId))
                ->when($status !== '', fn (Builder $query) => $query->whereRaw('LOWER(status) = ?', [Str::lower($status)]))
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
                ->through(function (Incident $incident): array {
                    $statusDefinitions = $incident->subcategory->statuses->isEmpty()
                        ? collect(IncidentStatus::defaults())
                        : $incident->subcategory->statuses->map(fn (IncidentStatus $status): array => [
                            'name' => $status->name,
                            'icon' => $status->icon->value,
                        ]);
                    $statusDefinition = $statusDefinitions->first(
                        fn (array $status): bool => Str::lower($status['name']) === Str::lower($incident->status),
                    );

                    return [
                        'id' => $incident->id,
                        'incident_number' => $incident->incident_number,
                        'incident_type' => $incident->subcategory->incidentType->name,
                        'subcategory' => $incident->subcategory->name,
                        'status' => $incident->status,
                        'status_label' => $statusDefinition['name'] ?? Str::headline($incident->status),
                        'status_icon' => $statusDefinition['icon'] ?? match (Str::lower($incident->status)) {
                            'resolved' => IncidentStatusIcon::CircleCheck->value,
                            'unresolved' => IncidentStatusIcon::CircleAlert->value,
                            default => IncidentStatusIcon::Clock->value,
                        },
                    ];
                }),
            'filters' => [
                'search' => $search,
                'year' => $year,
                'incident_type_id' => $incidentTypeId,
                'incident_type' => $selectedIncidentType?->name,
                'subcategory_id' => $subcategoryId,
                'subcategory' => $selectedSubcategory?->name,
                'status' => $status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('incidents/create', [
            'incidentTypes' => $this->incidentTypesForRegion($request->user()?->region_id),
        ]);
    }

    public function edit(Request $request, Incident $incident): Response
    {
        abort_unless($incident->region_id === $request->user()?->region_id, 403);

        $incidentTypes = $this->incidentTypesForRegion($request->user()?->region_id);
        $incident->load('subcategory:id,incident_type_id,name');
        $selectedType = $incidentTypes->firstWhere('id', $incident->subcategory->incident_type_id);
        $selectedSubcategory = $selectedType?->subcategories->firstWhere('id', $incident->incident_subcategory_id);
        $form = $selectedSubcategory?->forms->first();
        abort_if($form === null, 404);

        $savedFields = collect(data_get($incident->report_data, 'sections', []))
            ->flatMap(fn (array $section): array => $section['fields'] ?? [])
            ->keyBy('field_id');
        $fields = $form->sections->flatMap->fields;

        return Inertia::render('incidents/create', [
            'incidentTypes' => $incidentTypes,
            'incident' => [
                'id' => $incident->id,
                'incident_number' => $incident->incident_number,
                'incident_type_id' => $incident->subcategory->incident_type_id,
                'incident_subcategory_id' => $incident->incident_subcategory_id,
                'responses' => $fields->mapWithKeys(function ($field) use ($savedFields): array {
                    $value = $savedFields->get($field->id)['value'] ?? ($field->type === FormFieldType::Checkbox ? false : '');

                    return [$field->id => is_array($value) ? null : $value];
                })->all(),
                'existing_files' => $fields
                    ->filter(fn ($field): bool => $field->type === FormFieldType::File)
                    ->mapWithKeys(function ($field) use ($savedFields): array {
                        $value = $savedFields->get($field->id)['value'] ?? null;

                        return is_array($value) && isset($value['name'])
                            ? [$field->id => $value['name']]
                            : [];
                    })
                    ->all(),
            ],
        ]);
    }

    public function store(StoreIncidentRequest $request): RedirectResponse
    {
        $form = $request->incidentForm();
        abort_if($form === null, 422);

        $initialStatus = $form->subcategory->statuses
            ->first(fn (IncidentStatus $status): bool => $status->icon === IncidentStatusIcon::Clock)
            ?? $form->subcategory->statuses->first();

        Incident::query()->create([
            'incident_subcategory_id' => $form->incident_subcategory_id,
            'region_id' => $request->user()->region_id,
            'status' => $initialStatus?->name ?? 'Pending',
            'report_data' => $this->reportData($request, $form),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident report filed.')]);

        return to_route('incidents.index');
    }

    public function update(UpdateIncidentRequest $request, Incident $incident): RedirectResponse
    {
        $form = $request->incidentForm();
        abort_if($form === null, 422);

        $previousFilePaths = $this->reportFilePaths($incident->report_data);
        $reportData = $this->reportData($request, $form, $incident->report_data);

        $incident->update([
            'report_data' => $reportData,
        ]);

        Storage::disk('local')->delete(
            $previousFilePaths->diff($this->reportFilePaths($reportData))->all(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident updated.')]);

        return back();
    }

    public function destroy(Request $request, Incident $incident): RedirectResponse
    {
        abort_unless($incident->region_id === $request->user()?->region_id, 403);

        $filePaths = $this->reportFilePaths($incident->report_data);

        $incident->delete();
        Storage::disk('local')->delete($filePaths->all());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident deleted.')]);

        return back();
    }

    /** @return Collection<int, IncidentType> */
    private function incidentTypesForRegion(?string $regionId): Collection
    {
        return IncidentType::query()
            ->select('id', 'name')
            ->whereHas('subcategories.forms', fn (Builder $query) => $query->where('region_id', $regionId))
            ->with(['subcategories' => function (HasMany $query) use ($regionId): void {
                $query
                    ->select('id', 'incident_type_id', 'name')
                    ->whereHas('forms', fn (Builder $formQuery) => $formQuery->where('region_id', $regionId))
                    ->with([
                        'forms' => function (HasMany $formQuery) use ($regionId): void {
                            $formQuery
                                ->select('id', 'incident_subcategory_id', 'region_id', 'title', 'description')
                                ->where('region_id', $regionId)
                                ->with([
                                    'sections:id,incident_form_id,title,description,sort_order',
                                    'sections.fields:id,form_section_id,type,label,description,placeholder,is_required,sort_order',
                                    'sections.fields.options:id,form_field_id,label,value,sort_order',
                                ]);
                        },
                    ]);
            }])
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array<string, mixed>|null  $previousReportData
     * @return array<string, mixed>
     */
    private function reportData(
        StoreIncidentRequest $request,
        IncidentForm $form,
        ?array $previousReportData = null,
    ): array {
        $responses = $request->validated('responses', []);
        $previousFields = collect(data_get($previousReportData, 'sections', []))
            ->flatMap(fn (array $section): array => $section['fields'] ?? [])
            ->keyBy('field_id');

        return [
            'form_id' => $form->id,
            'title' => $form->title,
            'description' => $form->description,
            'sections' => $form->sections->map(function ($section) use ($request, $responses, $previousFields): array {
                return [
                    'title' => $section->title,
                    'description' => $section->description,
                    'fields' => $section->fields->map(function ($field) use ($request, $responses, $previousFields): array {
                        $value = $responses[$field->id] ?? null;

                        if ($field->type === FormFieldType::File) {
                            $value = $previousFields->get($field->id)['value'] ?? null;

                            if ($request->hasFile("responses.{$field->id}")) {
                                $file = $request->file("responses.{$field->id}");
                                $value = [
                                    'name' => $file->getClientOriginalName(),
                                    'path' => $file->store('incident-reports', 'local'),
                                ];
                            }
                        }

                        $selectedOption = $field->options->firstWhere('value', $value);

                        return [
                            'field_id' => $field->id,
                            'label' => $field->label,
                            'description' => $field->description,
                            'placeholder' => $field->placeholder,
                            'is_required' => $field->is_required,
                            'type' => $field->type->value,
                            'options' => $field->options->map->only(['label', 'value'])->all(),
                            'value' => $value,
                            'display_value' => $selectedOption?->label ?? $value,
                        ];
                    })->all(),
                ];
            })->all(),
        ];
    }

    /** @return \Illuminate\Support\Collection<int, string> */
    private function reportFilePaths(?array $reportData): \Illuminate\Support\Collection
    {
        return collect(data_get($reportData, 'sections', []))
            ->flatMap(fn (array $section): array => $section['fields'] ?? [])
            ->filter(fn (array $field): bool => ($field['type'] ?? null) === FormFieldType::File->value)
            ->pluck('value.path')
            ->filter(fn (mixed $path): bool => is_string($path));
    }
}
