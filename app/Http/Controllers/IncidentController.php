<?php

namespace App\Http\Controllers;

use App\Enums\FormFieldType;
use App\Enums\IncidentStatusIcon;
use App\Enums\UserRoleGroup;
use App\Http\Requests\StoreIncidentRequest;
use App\Http\Requests\UpdateIncidentRequest;
use App\Http\Requests\UpdateIncidentStatusRequest;
use App\Models\AttachmentType;
use App\Models\Incident;
use App\Models\IncidentForm;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
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
        $user = $request->user();
        $search = $request->string('search')->trim()->toString();
        $requestedRegionId = $request->string('region_id')->trim()->toString();
        $regionId = $user->isSuperAdmin()
            ? Region::query()->whereKey($requestedRegionId)->value('id')
            : null;
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
                ->select('id', 'incident_number', 'incident_subcategory_id', 'region_id', 'status', 'created_at')
                ->when(
                    $user->isSuperAdmin(),
                    fn (Builder $query) => $query->when(
                        $regionId !== null,
                        fn (Builder $regionQuery) => $regionQuery->where('region_id', $regionId),
                    ),
                    fn (Builder $query) => $query->where(function (Builder $accessQuery) use ($user): void {
                        $accessQuery
                            ->where('region_id', $user->region_id)
                            ->orWhereHas(
                                'routedRegions',
                                fn (Builder $regionQuery) => $regionQuery->whereKey($user->region_id),
                            );
                    }),
                )
                ->with([
                    'region:id,name',
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
                ->through(function (Incident $incident) use ($user): array {
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
                        'region' => $incident->region->name,
                        'status' => $incident->status,
                        'status_label' => $statusDefinition['name'] ?? Str::headline($incident->status),
                        'status_icon' => $statusDefinition['icon'] ?? match (Str::lower($incident->status)) {
                            'resolved' => IncidentStatusIcon::CircleCheck->value,
                            'unresolved' => IncidentStatusIcon::CircleAlert->value,
                            default => IncidentStatusIcon::Clock->value,
                        },
                        'can_manage' => $incident->isManageableBy($user),
                    ];
                }),
            'access' => [
                'can_file' => $user->canFileIncidents(),
                'can_manage' => $user->canManageIncidents(),
            ],
            'filters' => [
                'search' => $search,
                'year' => $year,
                'incident_type_id' => $incidentTypeId,
                'incident_type' => $selectedIncidentType?->name,
                'subcategory_id' => $subcategoryId,
                'subcategory' => $selectedSubcategory?->name,
                'status' => $status,
                'region_id' => $regionId ?? '',
            ],
            'regions' => $user->isSuperAdmin()
                ? Region::query()->select('id', 'name')->orderBy('name')->get()
                : [],
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->canFileIncidents(), 403);

        return Inertia::render('incidents/create', [
            'incidentTypes' => $this->incidentTypesForRegion($request->user()?->region_id),
        ]);
    }

    public function show(Request $request, Incident $incident): Response
    {
        abort_unless($incident->isAccessibleBy($request->user()), 403);

        $messageLimit = min(max($request->integer('messages', 30), 30), 150);

        $incident->load([
            'subcategory:id,incident_type_id,name',
            'subcategory.incidentType:id,name',
            'subcategory.statuses:id,incident_subcategory_id,name,icon,sort_order',
            'region:id,name',
            'routedRegions:id,name',
        ]);

        $messages = $incident->messages()
            ->select('id', 'incident_id', 'user_id', 'message', 'created_at')
            ->with([
                'user:id,name,user_role_id',
                'user.userRole:id,organization_group',
                'attachments:id,incident_message_id,attachment_type_id,original_name,path,mime_type,size',
                'attachments.attachmentType:id,name',
            ])
            ->latest()
            ->limit($messageLimit + 1)
            ->get();
        $hasEarlierMessages = $messages->count() > $messageLimit;
        $messages = $messages->take($messageLimit)->reverse()->values();

        $statusDefinition = $incident->managedStatusDefinition();
        $canManageRouting = $incident->routingIsManageableBy($request->user());
        $originatesFromCentralOffice = $incident->region->name === Region::CentralOffice;

        return Inertia::render('incidents/show', [
            'incident' => [
                'id' => $incident->id,
                'incident_number' => $incident->incident_number,
                'incident_type' => $incident->subcategory->incidentType->name,
                'subcategory' => $incident->subcategory->name,
                'report_title' => data_get($incident->report_data, 'title', 'Incident report'),
                'report_description' => data_get($incident->report_data, 'description'),
                'report_sections' => $this->reportSectionsForDisplay($incident->report_data),
                'status_label' => $statusDefinition['name'],
                'status_icon' => $statusDefinition['icon'],
                'managed_statuses' => $incident->managedStatusDefinitions()->all(),
                'conversation_open' => $incident->conversationIsOpen(),
                'can_respond' => $request->user()->canRespondToIncidents(),
                'can_manage_status' => $request->user()->can('manage-incident-statuses'),
            ],
            'conversation' => fn (): array => [
                'messages' => $messages->map(fn ($message): array => [
                    'id' => $message->id,
                    'message' => $message->message,
                    'sender_name' => $message->user->name,
                    'sender_label' => $message->user->userRole?->organization_group === UserRoleGroup::CentralOffice
                        ? 'CHED CO'
                        : 'CHED RO',
                    'is_own' => $message->user_id === $request->user()->id,
                    'created_at' => $message->created_at?->toIso8601String(),
                    'attachments' => $message->attachments->map(fn ($attachment): array => [
                        'id' => $attachment->id,
                        'name' => $attachment->original_name,
                        'url' => Storage::disk('public')->url($attachment->path),
                        'mime_type' => $attachment->mime_type,
                        'size' => $attachment->size,
                        'type_name' => $attachment->attachmentType?->name,
                    ])->all(),
                ])->all(),
                'has_earlier_messages' => $hasEarlierMessages,
                'message_limit' => $messageLimit,
            ],
            'attachment_groups' => Inertia::defer(
                fn (): array => $this->attachmentGroupsForIncident($incident, $request->user()->id),
            ),
            'attachment_types' => [
                'items' => AttachmentType::query()
                    ->select('id', 'name')
                    ->where('region_id', $request->user()->region_id)
                    ->orderBy('name')
                    ->get()
                    ->map(fn (AttachmentType $attachmentType): array => [
                        'id' => $attachmentType->id,
                        'name' => $attachmentType->name,
                    ])
                    ->all(),
                'can_manage' => $request->user()->can('manage-forms'),
            ],
            'routing' => [
                'origin_region' => $incident->region->name,
                'can_manage' => $canManageRouting,
                'routed_regions' => $incident->routedRegions
                    ->map(fn (Region $region): array => ['id' => $region->id, 'name' => $region->name])
                    ->values()
                    ->all(),
                'available_regions' => $canManageRouting
                    ? Region::query()
                        ->select('id', 'name')
                        ->when(
                            $originatesFromCentralOffice,
                            fn (Builder $query) => $query->where('name', '!=', Region::CentralOffice),
                            fn (Builder $query) => $query->where('name', Region::CentralOffice),
                        )
                        ->orderBy('name')
                        ->get()
                        ->map(fn (Region $region): array => ['id' => $region->id, 'name' => $region->name])
                        ->all()
                    : [],
            ],
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    private function attachmentGroupsForIncident(Incident $incident, int $viewerId): array
    {
        return $incident->messages()
            ->select('id', 'incident_id', 'user_id', 'created_at')
            ->whereHas('attachments')
            ->with([
                'user:id,name,user_role_id',
                'user.userRole:id,organization_group',
                'attachments:id,incident_message_id,attachment_type_id,original_name,path,mime_type,size',
                'attachments.attachmentType:id,name',
            ])
            ->latest()
            ->get()
            ->map(fn ($message): array => [
                'id' => $message->id,
                'sender_name' => $message->user->name,
                'sender_label' => $message->user->userRole?->organization_group === UserRoleGroup::CentralOffice
                    ? 'CHED CO'
                    : 'CHED RO',
                'is_own' => $message->user_id === $viewerId,
                'created_at' => $message->created_at?->toIso8601String(),
                'attachments' => $message->attachments->map(fn ($attachment): array => [
                    'id' => $attachment->id,
                    'name' => $attachment->original_name,
                    'url' => Storage::disk('public')->url($attachment->path),
                    'mime_type' => $attachment->mime_type,
                    'size' => $attachment->size,
                    'type_name' => $attachment->attachmentType?->name,
                ])->all(),
            ])
            ->all();
    }

    public function edit(Request $request, Incident $incident): Response
    {
        abort_unless($incident->isManageableBy($request->user()), 403);

        $incidentTypes = $this->incidentTypesForRegion($incident->region_id);
        $incident->load('subcategory:id,incident_type_id,name');
        $selectedType = $incidentTypes->firstWhere('id', $incident->subcategory->incident_type_id);
        $selectedSubcategory = $selectedType?->subcategories->firstWhere('id', $incident->incident_subcategory_id);
        $form = $selectedSubcategory?->forms->first();
        abort_if($form === null, 404);

        $savedFields = $this->reportFields($incident->report_data)->keyBy('field_id');
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

        $this->deleteReportFiles(
            $previousFilePaths->diff($this->reportFilePaths($reportData))->all(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident updated.')]);

        return back();
    }

    public function updateStatus(UpdateIncidentStatusRequest $request, Incident $incident): RedirectResponse
    {
        $incident->update([
            'status' => $request->validated('status'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident status updated.')]);

        return back();
    }

    public function destroy(Request $request, Incident $incident): RedirectResponse
    {
        abort_unless($incident->isManageableBy($request->user()), 403);

        $filePaths = $this->reportFilePaths($incident->report_data);
        $messageFilePaths = $incident->messages()
            ->with('attachments:id,incident_message_id,path')
            ->get()
            ->flatMap->attachments
            ->pluck('path');

        $incident->delete();
        $this->deleteReportFiles($filePaths->all());
        Storage::disk('public')->delete($messageFilePaths->all());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Incident deleted.')]);

        return back();
    }

    /** @return Collection<int, IncidentType> */
    private function incidentTypesForRegion(?string $regionId): Collection
    {
        return IncidentType::query()
            ->select('id', 'region_id', 'name')
            ->where('region_id', $regionId)
            ->whereHas('subcategories.forms', fn (Builder $query) => $query->where('region_id', $regionId))
            ->with(['subcategories' => function (HasMany $query) use ($regionId): void {
                $query
                    ->select('id', 'incident_type_id', 'region_id', 'name')
                    ->where('region_id', $regionId)
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
        $previousFields = $this->reportFields($previousReportData)->keyBy('field_id');

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
                                    'path' => $file->store('incident-reports', 'public'),
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

    /**
     * @param  array<string, mixed>|null  $reportData
     * @return \Illuminate\Support\Collection<int, string>
     */
    private function reportFilePaths(?array $reportData): \Illuminate\Support\Collection
    {
        return $this->reportFields($reportData)
            ->filter(fn (array $field): bool => ($field['type'] ?? null) === FormFieldType::File->value)
            ->pluck('value.path')
            ->filter(fn (mixed $path): bool => is_string($path));
    }

    /**
     * @param  array<string, mixed>|null  $reportData
     * @return array<int, array<string, mixed>>
     */
    private function reportSectionsForDisplay(?array $reportData): array
    {
        $sections = $reportData['sections'] ?? null;

        if (! is_array($sections)) {
            return [];
        }

        $displaySections = [];

        foreach ($sections as $section) {
            if (! is_array($section)) {
                continue;
            }

            $displayFields = [];
            $fields = $section['fields'] ?? null;

            if (is_array($fields)) {
                foreach ($fields as $field) {
                    if (! is_array($field)) {
                        continue;
                    }

                    $value = $field['display_value'] ?? $field['value'] ?? null;
                    $attachment = null;

                    if (($field['type'] ?? null) === FormFieldType::File->value && is_array($value)) {
                        $path = $value['path'] ?? null;
                        $name = $value['name'] ?? null;

                        if (is_string($path)) {
                            $attachment = [
                                'name' => is_string($name) ? $name : basename($path),
                                'url' => $this->reportAttachmentUrl($path),
                                'mime_type' => $this->reportAttachmentMimeType($path),
                            ];
                        }

                        $value = $attachment['name'] ?? null;
                    } elseif (is_bool($value)) {
                        $value = $value ? __('Yes') : __('No');
                    } elseif (is_array($value)) {
                        $value = collect($value)->filter(fn (mixed $item): bool => is_scalar($item))->implode(', ');
                    }

                    $label = $field['label'] ?? null;
                    $displayFields[] = [
                        'label' => is_string($label) ? $label : __('Untitled field'),
                        'value' => filled($value) ? (string) $value : '—',
                        'attachment' => $attachment,
                    ];
                }
            }

            $title = $section['title'] ?? null;
            $description = $section['description'] ?? null;
            $displaySections[] = [
                'title' => is_string($title) ? $title : null,
                'description' => is_string($description) ? $description : null,
                'fields' => $displayFields,
            ];
        }

        return $displaySections;
    }

    private function reportAttachmentUrl(string $path): string
    {
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->url($path);
        }

        return Storage::disk('local')->temporaryUrl($path, now()->addMinutes(30));
    }

    private function reportAttachmentMimeType(string $path): string
    {
        $disk = Storage::disk(Storage::disk('public')->exists($path) ? 'public' : 'local');

        return $disk->mimeType($path) ?: 'application/octet-stream';
    }

    /**
     * @param  array<string, mixed>|null  $reportData
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function reportFields(?array $reportData): \Illuminate\Support\Collection
    {
        $sections = $reportData['sections'] ?? null;
        $fields = [];

        if (! is_array($sections)) {
            return collect($fields);
        }

        foreach ($sections as $section) {
            if (! is_array($section) || ! is_array($section['fields'] ?? null)) {
                continue;
            }

            foreach ($section['fields'] as $field) {
                if (is_array($field)) {
                    $normalizedField = [];

                    foreach ($field as $key => $value) {
                        if (is_string($key)) {
                            $normalizedField[$key] = $value;
                        }
                    }

                    $fields[] = $normalizedField;
                }
            }
        }

        return collect($fields);
    }

    /** @param array<int, string> $paths */
    private function deleteReportFiles(array $paths): void
    {
        Storage::disk('public')->delete($paths);
        Storage::disk('local')->delete($paths);
    }
}
