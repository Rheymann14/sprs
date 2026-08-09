<?php

use App\Enums\FormFieldType;
use App\Enums\IncidentStatusIcon;
use App\Enums\UserRoleGroup;
use App\Models\FormField;
use App\Models\FormFieldOption;
use App\Models\FormSection;
use App\Models\Incident;
use App\Models\IncidentForm;
use App\Models\IncidentMessage;
use App\Models\IncidentMessageAttachment;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function incidentUser(Region $region, string $roleName = UserRole::RegionalOfficeStaff): User
{
    $role = UserRole::query()->firstOrCreate(['name' => $roleName]);

    return User::factory()
        ->for($region)
        ->for($role, 'userRole')
        ->create();
}

test('guests are redirected from incidents', function () {
    $this->get(route('incidents.index'))->assertRedirect(route('login'));
});

test('authenticated users can view incidents from their region', function () {
    $region = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = incidentUser($region);
    $type = IncidentType::factory()->create(['name' => 'HAZING']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create([
        'name' => 'Physical hazing',
    ]);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Under review',
        'icon' => IncidentStatusIcon::Clock,
        'sort_order' => 0,
    ]);
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'incident_number' => '2026-HAZING-1A34',
            'status' => 'Under review',
        ]);
    Incident::factory()
        ->for($otherRegion)
        ->for($subcategory, 'subcategory')
        ->create();

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/index')
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $incident->id)
            ->where('incidents.data.0.incident_number', '2026-HAZING-1A34')
            ->where('incidents.data.0.incident_type', 'HAZING')
            ->where('incidents.data.0.subcategory', 'Physical hazing')
            ->where('incidents.data.0.status_label', 'Under review')
            ->where('incidents.data.0.status_icon', IncidentStatusIcon::Clock->value)
        );
});

test('incidents can be searched and paginated', function () {
    $region = Region::factory()->create();
    $user = incidentUser($region);
    $type = IncidentType::factory()->create(['name' => 'HAZING']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create([
        'name' => 'Physical hazing',
    ]);

    Incident::factory()
        ->count(11)
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create();

    $target = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create(['incident_number' => '2026-HAZING-1A34']);

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('incidents.data', 10)
            ->where('incidents.total', 12)
            ->where('incidents.last_page', 2)
        );

    $this->actingAs($user)
        ->get(route('incidents.index', ['search' => '1A34']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.search', '1A34')
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $target->id)
        );
});

test('incidents can be filtered from a statistics count card', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $type = IncidentType::factory()->create(['name' => 'Child Protection']);
    $otherType = IncidentType::factory()->create(['name' => 'Other']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create([
        'name' => 'Bullying',
    ]);
    $otherSubcategory = IncidentSubcategory::factory()->for($otherType)->create();

    $matchingIncident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'status' => 'Closed',
            'created_at' => '2025-05-01 08:00:00',
        ]);
    Incident::factory()->for($region)->for($subcategory, 'subcategory')->create([
        'status' => 'Monitoring',
        'created_at' => '2025-05-01 08:00:00',
    ]);
    Incident::factory()->for($region)->for($subcategory, 'subcategory')->create([
        'status' => 'Closed',
        'created_at' => '2024-05-01 08:00:00',
    ]);
    Incident::factory()->for($region)->for($otherSubcategory, 'subcategory')->create([
        'status' => 'Closed',
        'created_at' => '2025-05-01 08:00:00',
    ]);

    $this->actingAs($user)
        ->get(route('incidents.index', [
            'year' => 2025,
            'incident_type_id' => $type->id,
            'subcategory_id' => $subcategory->id,
            'status' => 'Closed',
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $matchingIncident->id)
            ->where('filters.year', 2025)
            ->where('filters.incident_type_id', $type->id)
            ->where('filters.incident_type', 'Child Protection')
            ->where('filters.subcategory_id', $subcategory->id)
            ->where('filters.subcategory', 'Bullying')
            ->where('filters.status', 'Closed')
        );
});

test('incident numbers use the creation year type and a four character suffix', function () {
    $this->travelTo('2026-08-07 12:00:00');
    $type = IncidentType::factory()->create(['name' => 'Hazing']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create();

    $incident = Incident::factory()
        ->for($subcategory, 'subcategory')
        ->create();

    expect($incident->incident_number)->toMatch('/^2026-HAZING-[A-Z0-9]{4}$/');
});

test('users see report forms saved for their region', function () {
    $region = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = incidentUser($region);
    $type = IncidentType::factory()->for($region)->create(['name' => 'Fire']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create(['name' => 'Structural fire']);
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create(['title' => 'Fire report']);
    $otherType = IncidentType::factory()->for($otherRegion)->create(['name' => 'Flood']);
    $otherSubcategory = IncidentSubcategory::factory()->for($otherType)->create(['name' => 'Flash flood']);
    IncidentForm::factory()
        ->for($otherSubcategory, 'subcategory')
        ->for($otherRegion)
        ->create(['title' => 'Other region report']);

    $section = FormSection::factory()->for($form, 'form')->create(['title' => 'Location']);
    FormField::factory()->for($section, 'section')->create(['label' => 'Address']);

    $this->actingAs($user)
        ->get(route('incidents.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/create')
            ->has('incidentTypes', 1)
            ->where('incidentTypes.0.name', 'Fire')
            ->where('incidentTypes.0.subcategories.0.name', 'Structural fire')
            ->where('incidentTypes.0.subcategories.0.forms.0.title', 'Fire report')
            ->where('incidentTypes.0.subcategories.0.forms.0.sections.0.title', 'Location')
            ->missing('incidentTypes.0.subcategories.0.forms.1')
        );
});

test('users can submit a regional incident report', function () {
    $region = Region::factory()->create();
    $user = incidentUser($region);
    $type = IncidentType::factory()->create(['name' => 'Medical']);
    $subcategory = IncidentSubcategory::factory()->for($type)->create(['name' => 'Emergency']);
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create(['title' => 'Medical assessment']);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Awaiting response',
        'icon' => IncidentStatusIcon::Clock,
        'sort_order' => 0,
    ]);
    $section = FormSection::factory()->for($form, 'form')->create(['title' => 'Patient']);
    $textField = FormField::factory()->for($section, 'section')->create([
        'label' => 'Patient name',
        'is_required' => true,
        'sort_order' => 0,
    ]);
    $dropdown = FormField::factory()->for($section, 'section')->create([
        'type' => FormFieldType::Dropdown,
        'label' => 'Severity',
        'is_required' => true,
        'sort_order' => 1,
    ]);
    $option = FormFieldOption::factory()->for($dropdown, 'field')->create([
        'label' => 'Critical',
        'value' => 'critical',
    ]);

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'incident_subcategory_id' => $subcategory->id,
            'responses' => [
                $textField->id => 'Juan Dela Cruz',
                $dropdown->id => $option->value,
            ],
        ])
        ->assertRedirect(route('incidents.index'))
        ->assertInertiaFlash('toast.type', 'success')
        ->assertInertiaFlash('toast.message', 'Incident report filed.');

    $incident = Incident::query()->firstOrFail();

    expect($incident->region_id)->toBe($region->id)
        ->and($incident->incident_subcategory_id)->toBe($subcategory->id)
        ->and($incident->status)->toBe('Awaiting response')
        ->and($incident->report_data['title'])->toBe('Medical assessment')
        ->and($incident->report_data['sections'][0]['fields'][0]['value'])->toBe('Juan Dela Cruz')
        ->and($incident->report_data['sections'][0]['fields'][1]['display_value'])->toBe('Critical');

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $incident->id)
            ->where('incidents.data.0.incident_type', 'Medical')
            ->where('incidents.data.0.subcategory', 'Emergency')
        );
});

test('users cannot submit another regions report form', function () {
    $userRegion = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $user = incidentUser($userRegion);
    $subcategory = IncidentSubcategory::factory()->create();
    IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($otherRegion)
        ->create();

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'incident_subcategory_id' => $subcategory->id,
            'responses' => [],
        ])
        ->assertSessionHasErrors('incident_subcategory_id');

    expect(Incident::query()->doesntExist())->toBeTrue();
});

test('required report fields are validated', function () {
    $region = Region::factory()->create();
    $user = incidentUser($region);
    $subcategory = IncidentSubcategory::factory()->create();
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create();
    $section = FormSection::factory()->for($form, 'form')->create();
    $field = FormField::factory()->for($section, 'section')->create([
        'label' => 'Location',
        'is_required' => true,
    ]);

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'incident_subcategory_id' => $subcategory->id,
            'responses' => [],
        ])
        ->assertSessionHasErrors("responses.{$field->id}");

    expect(Incident::query()->doesntExist())->toBeTrue();
});

test('administrators can edit incident report details without changing status', function () {
    $region = Region::factory()->create();
    $user = incidentUser($region, UserRole::RegionalOfficeAdministrator);
    $incidentType = IncidentType::factory()->for($region)->create();
    $subcategory = IncidentSubcategory::factory()->for($incidentType)->create();
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Closed',
        'icon' => IncidentStatusIcon::CircleCheck,
        'sort_order' => 0,
    ]);
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($region)
        ->create(['title' => 'Incident details']);
    $section = FormSection::factory()->for($form, 'form')->create([
        'title' => 'Details',
    ]);
    $field = FormField::factory()->for($section, 'section')->create([
        'label' => 'Location',
        'is_required' => true,
    ]);
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'status' => 'Closed',
            'report_data' => [
                'title' => 'Incident details',
                'sections' => [
                    [
                        'title' => 'Details',
                        'fields' => [
                            [
                                'field_id' => $field->id,
                                'label' => 'Location',
                                'type' => FormFieldType::Text->value,
                                'value' => 'Old location',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

    $this->actingAs($user)
        ->get(route('incidents.edit', $incident))
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/create')
            ->where('incident.id', $incident->id)
            ->where('incident.incident_type_id', $subcategory->incident_type_id)
            ->where('incident.incident_subcategory_id', $subcategory->id)
            ->where("incident.responses.{$field->id}", 'Old location')
        );

    $this->actingAs($user)
        ->from(route('incidents.index'))
        ->put(route('incidents.update', $incident), [
            'incident_subcategory_id' => $subcategory->id,
            'status' => 'Not configured',
            'responses' => [
                $field->id => 'Updated location',
            ],
        ])
        ->assertRedirect(route('incidents.index'))
        ->assertInertiaFlash('toast.message', 'Incident updated.');

    expect($incident->refresh()->status)->toBe('Closed')
        ->and($incident->report_data['sections'][0]['fields'][0]['value'])->toBe('Updated location');

    $this->actingAs($user)
        ->put(route('incidents.update', $incident), [
            'incident_subcategory_id' => IncidentSubcategory::factory()->create()->id,
            'responses' => [$field->id => 'Updated location'],
        ])
        ->assertSessionHasErrors('incident_subcategory_id');
});

test('administrators cannot update or delete incidents from another region', function () {
    $user = incidentUser(Region::factory()->create(), UserRole::RegionalOfficeAdministrator);
    $incident = Incident::factory()->for(Region::factory())->create();

    $this->actingAs($user)
        ->get(route('incidents.edit', $incident))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('incidents.update', $incident), ['status' => 'Pending'])
        ->assertForbidden();

    $this->actingAs($user)
        ->delete(route('incidents.destroy', $incident))
        ->assertForbidden();

    $this->assertModelExists($incident);
});

test('administrators can delete regional incidents and their attachments', function () {
    Storage::fake('local');
    Storage::disk('local')->put('incident-reports/evidence.pdf', 'evidence');

    $region = Region::factory()->create();
    $user = incidentUser($region, UserRole::RegionalOfficeAdministrator);
    $incident = Incident::factory()->for($region)->create([
        'report_data' => [
            'sections' => [
                [
                    'fields' => [
                        [
                            'type' => FormFieldType::File->value,
                            'value' => [
                                'name' => 'evidence.pdf',
                                'path' => 'incident-reports/evidence.pdf',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ]);

    $this->actingAs($user)
        ->from(route('incidents.index'))
        ->delete(route('incidents.destroy', $incident))
        ->assertRedirect(route('incidents.index'))
        ->assertInertiaFlash('toast.message', 'Incident deleted.');

    $this->assertModelMissing($incident);
    Storage::disk('local')->assertMissing('incident-reports/evidence.pdf');
});

test('staff can file and reply but cannot edit delete or route incidents', function () {
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $region = Region::factory()->create();
    $staff = incidentUser($region);
    $incident = Incident::factory()->for($region)->create(['status' => 'Pending']);

    $this->actingAs($staff)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('access.can_file', true)
            ->where('access.can_manage', false)
            ->where('incidents.data.0.can_manage', false)
        );

    $this->actingAs($staff)
        ->get(route('incidents.show', $incident))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incident.can_respond', true)
            ->where('routing.can_manage', false)
        );

    $this->actingAs($staff)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Staff response'])
        ->assertRedirect();

    $this->actingAs($staff)->get(route('incidents.edit', $incident))->assertForbidden();
    $this->actingAs($staff)->put(route('incidents.update', $incident), [])->assertForbidden();
    $this->actingAs($staff)->delete(route('incidents.destroy', $incident))->assertForbidden();
    $this->actingAs($staff)
        ->put(route('incidents.routing.update', $incident), ['region_ids' => [$centralRegion->id]])
        ->assertForbidden();

    expect($incident->messages()->value('message'))->toBe('Staff response');
    $this->assertModelExists($incident);
});

test('users can view a regional incident report and its conversation', function () {
    Storage::fake('public');
    Storage::disk('public')->put('incident-reports/report.pdf', 'report');

    $region = Region::factory()->create();
    $regionalRole = UserRole::query()->create([
        'name' => UserRole::RegionalOfficeStaff,
    ]);
    $centralRole = UserRole::query()->create([
        'name' => UserRole::CentralOfficeStaff,
    ]);
    $regionalUser = User::factory()
        ->for($region)
        ->for($regionalRole, 'userRole')
        ->create();
    $centralUser = User::factory()
        ->for($region)
        ->for($centralRole, 'userRole')
        ->create();
    $subcategory = IncidentSubcategory::factory()->create();
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Resolved',
        'icon' => IncidentStatusIcon::CircleCheck,
        'sort_order' => 0,
    ]);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Pending',
        'icon' => IncidentStatusIcon::Clock,
        'sort_order' => 1,
    ]);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Unresolved',
        'icon' => IncidentStatusIcon::CircleAlert,
        'sort_order' => 2,
    ]);
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create([
            'status' => 'Resolved',
            'report_data' => [
                'title' => 'Saved incident report',
                'sections' => [[
                    'title' => 'Details',
                    'fields' => [
                        [
                            'label' => 'Location',
                            'type' => FormFieldType::Text->value,
                            'value' => 'Main campus',
                        ],
                        [
                            'label' => 'Evidence',
                            'type' => FormFieldType::File->value,
                            'value' => [
                                'name' => 'report.pdf',
                                'path' => 'incident-reports/report.pdf',
                            ],
                        ],
                    ],
                ]],
            ],
        ]);
    $message = IncidentMessage::factory()
        ->for($incident)
        ->for($centralUser)
        ->create(['message' => 'Central Office reviewed the report.']);
    IncidentMessageAttachment::factory()->for($message, 'message')->create([
        'original_name' => 'review.pdf',
        'path' => 'incident-messages/review.pdf',
        'mime_type' => 'application/pdf',
        'size' => 2048,
    ]);

    $this->actingAs($regionalUser)
        ->get(route('incidents.show', $incident))
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/show')
            ->where('incident.incident_number', $incident->incident_number)
            ->where('incident.report_title', 'Saved incident report')
            ->where('incident.report_sections.0.fields.0.value', 'Main campus')
            ->where('incident.report_sections.0.fields.1.attachment.name', 'report.pdf')
            ->where('conversation.messages.0.sender_label', 'CHED CO')
            ->where('conversation.messages.0.is_own', false)
            ->where('conversation.messages.0.attachments.0.name', 'review.pdf')
            ->where('conversation.has_earlier_messages', false)
            ->where('conversation.message_limit', 30)
            ->where('incident.status_label', 'Resolved')
            ->where('incident.status_icon', IncidentStatusIcon::CircleCheck->value)
            ->where('incident.conversation_open', false)
            ->has('incident.managed_statuses', 3)
        );

    expect($regionalRole->organization_group)->toBe(UserRoleGroup::RegionalOffice)
        ->and($centralRole->organization_group)->toBe(UserRoleGroup::CentralOffice);
});

test('incident conversations initially load only the latest messages', function () {
    $region = Region::factory()->create();
    $user = User::factory()->for($region)->create();
    $incident = Incident::factory()->for($region)->create(['status' => 'Pending']);

    IncidentMessage::factory()
        ->count(35)
        ->for($incident)
        ->for($user)
        ->sequence(fn (Sequence $sequence): array => [
            'message' => "Message {$sequence->index}",
            'created_at' => now()->addSeconds($sequence->index),
        ])
        ->create();

    $this->actingAs($user)
        ->get(route('incidents.show', $incident))
        ->assertInertia(fn (Assert $page) => $page
            ->has('conversation.messages', 30)
            ->where('conversation.messages.0.message', 'Message 5')
            ->where('conversation.messages.29.message', 'Message 34')
            ->where('conversation.has_earlier_messages', true)
            ->where('conversation.message_limit', 30)
        );

    $this->actingAs($user)
        ->get(route('incidents.show', [$incident, 'messages' => 60]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('conversation.messages', 35)
            ->where('conversation.messages.0.message', 'Message 0')
            ->where('conversation.has_earlier_messages', false)
            ->where('conversation.message_limit', 60)
        );
});

test('users can send incident messages with up to five public attachments', function () {
    Storage::fake('public');

    $region = Region::factory()->create();
    $user = incidentUser($region);
    $incident = Incident::factory()->for($region)->create(['status' => 'Pending']);
    $attachments = [
        UploadedFile::fake()->image('photo.jpg')->size(100),
        UploadedFile::fake()->create('document.pdf', 200, 'application/pdf'),
    ];

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), [
            'message' => 'Please review these files.',
            'attachments' => $attachments,
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.message', 'Message sent.');

    $message = $incident->messages()->with('attachments')->firstOrFail();

    expect($message->message)->toBe('Please review these files.')
        ->and($message->user_id)->toBe($user->id)
        ->and($message->attachments)->toHaveCount(2);

    $message->attachments->each(
        fn (IncidentMessageAttachment $attachment) => Storage::disk('public')->assertExists($attachment->path),
    );
});

test('incident message attachments enforce file count type and size limits', function () {
    Storage::fake('public');

    $region = Region::factory()->create();
    $user = incidentUser($region);
    $incident = Incident::factory()->for($region)->create(['status' => 'Pending']);

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), [
            'attachments' => collect(range(1, 6))
                ->map(fn (int $index) => UploadedFile::fake()->image("photo-{$index}.png"))
                ->all(),
        ])
        ->assertSessionHasErrors('attachments');

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), [
            'attachments' => [UploadedFile::fake()->create('archive.zip', 100, 'application/zip')],
        ])
        ->assertSessionHasErrors('attachments.0');

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), [
            'attachments' => [UploadedFile::fake()->create('large.pdf', 5121, 'application/pdf')],
        ])
        ->assertSessionHasErrors('attachments.0');

    expect($incident->messages()->doesntExist())->toBeTrue();
});

test('resolved and unresolved incidents lock messages until returned to pending', function () {
    $region = Region::factory()->create();
    $administratorRole = UserRole::query()->create([
        'name' => UserRole::RegionalOfficeAdministrator,
    ]);
    $user = User::factory()
        ->for($region)
        ->for($administratorRole, 'userRole')
        ->create();
    $subcategory = IncidentSubcategory::factory()->create();
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Resolved',
        'icon' => IncidentStatusIcon::CircleCheck,
        'sort_order' => 0,
    ]);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Pending',
        'icon' => IncidentStatusIcon::Clock,
        'sort_order' => 1,
    ]);
    IncidentStatus::factory()->for($subcategory, 'subcategory')->create([
        'name' => 'Unresolved',
        'icon' => IncidentStatusIcon::CircleAlert,
        'sort_order' => 2,
    ]);
    $incident = Incident::factory()
        ->for($region)
        ->for($subcategory, 'subcategory')
        ->create(['status' => 'Pending']);

    $this->actingAs($user)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Resolved'])
        ->assertRedirect()
        ->assertInertiaFlash('toast.message', 'Incident status updated.');

    expect($incident->refresh()->status)->toBe('Resolved')
        ->and($incident->conversationIsOpen())->toBeFalse();

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Closed message'])
        ->assertForbidden();

    $this->actingAs($user)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Pending'])
        ->assertRedirect();

    expect($incident->refresh()->conversationIsOpen())->toBeTrue();

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Reopened message'])
        ->assertRedirect();

    expect($incident->messages()->value('message'))->toBe('Reopened message');

    $this->actingAs($user)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Unresolved'])
        ->assertRedirect();

    expect($incident->refresh()->conversationIsOpen())->toBeFalse();

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Still closed'])
        ->assertForbidden();

    $this->actingAs($user)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Unknown'])
        ->assertSessionHasErrors('status');
});

test('users cannot view or message incidents from another region', function () {
    $user = User::factory()->for(Region::factory())->create();
    $incident = Incident::factory()->for(Region::factory())->create();

    $this->actingAs($user)
        ->get(route('incidents.show', $incident))
        ->assertForbidden();

    $this->actingAs($user)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Not allowed'])
        ->assertForbidden();

    $this->actingAs($user)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Pending'])
        ->assertForbidden();

    expect($incident->messages()->doesntExist())->toBeTrue();
});

test('super admins can access and filter incidents across regions', function () {
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $regionalOffice = Region::factory()->create();
    $superAdminRole = UserRole::query()->create(['name' => UserRole::SuperAdmin]);
    $superAdmin = User::factory()
        ->for($centralRegion)
        ->for($superAdminRole, 'userRole')
        ->create();
    $centralType = IncidentType::factory()->for($centralRegion)->create();
    $centralSubcategory = IncidentSubcategory::factory()->for($centralType)->create();
    $regionalType = IncidentType::factory()->for($regionalOffice)->create();
    $regionalSubcategory = IncidentSubcategory::factory()->for($regionalType)->create();
    $centralIncident = Incident::factory()
        ->for($centralRegion)
        ->for($centralSubcategory, 'subcategory')
        ->create();
    $regionalIncident = Incident::factory()
        ->for($regionalOffice)
        ->for($regionalSubcategory, 'subcategory')
        ->create(['status' => 'Pending']);

    $this->actingAs($superAdmin)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidents.total', 2)
            ->where('filters.region_id', '')
            ->has('regions', 2)
        );

    $this->actingAs($superAdmin)
        ->get(route('incidents.index', ['region_id' => $regionalOffice->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $regionalIncident->id)
            ->where('incidents.data.0.region', $regionalOffice->name)
            ->where('filters.region_id', $regionalOffice->id)
        );

    $this->actingAs($superAdmin)
        ->get(route('incidents.show', $regionalIncident))
        ->assertSuccessful();

    expect($centralIncident->region_id)->toBe($centralRegion->id);
});

test('regional administrators can route incidents to central office for staff conversation access', function () {
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $regionalOffice = Region::factory()->create();
    $regionalRole = UserRole::query()->create(['name' => UserRole::RegionalOfficeAdministrator]);
    $centralRole = UserRole::query()->create(['name' => UserRole::CentralOfficeStaff]);
    $agencyRole = UserRole::query()->create(['name' => UserRole::Agency]);
    $regionalUser = User::factory()
        ->for($regionalOffice)
        ->for($regionalRole, 'userRole')
        ->create();
    $centralUser = User::factory()
        ->for($centralRegion)
        ->for($centralRole, 'userRole')
        ->create();
    $agencyUser = User::factory()
        ->for($regionalOffice)
        ->for($agencyRole, 'userRole')
        ->create();
    $incident = Incident::factory()->for($regionalOffice)->create(['status' => 'Pending']);

    $this->actingAs($regionalUser)
        ->put(route('incidents.routing.update', $incident), [
            'region_ids' => [$centralRegion->id],
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.message', 'Incident routing updated.');

    expect($incident->routedRegions()->pluck('regions.id')->all())->toBe([$centralRegion->id]);

    $this->actingAs($centralUser)
        ->get(route('incidents.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidents.total', 1)
            ->where('incidents.data.0.id', $incident->id)
        );

    $this->actingAs($centralUser)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Central Office response'])
        ->assertRedirect();

    $this->actingAs($agencyUser)
        ->get(route('incidents.show', $incident))
        ->assertSuccessful();

    $this->actingAs($agencyUser)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Agency response'])
        ->assertForbidden();

    $this->actingAs($agencyUser)
        ->put(route('incidents.routing.update', $incident), ['region_ids' => []])
        ->assertForbidden();

    expect($incident->messages()->value('message'))->toBe('Central Office response');
});

test('central office administrators can route incidents to regional staff', function () {
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $targetRegion = Region::factory()->create();
    $otherRegion = Region::factory()->create();
    $centralRole = UserRole::query()->create(['name' => UserRole::CentralOfficeAdministrator]);
    $regionalRole = UserRole::query()->create(['name' => UserRole::RegionalOfficeStaff]);
    $agencyRole = UserRole::query()->create(['name' => UserRole::Agency]);
    $centralUser = User::factory()
        ->for($centralRegion)
        ->for($centralRole, 'userRole')
        ->create();
    $regionalUser = User::factory()
        ->for($targetRegion)
        ->for($regionalRole, 'userRole')
        ->create();
    $agencyUser = User::factory()
        ->for($targetRegion)
        ->for($agencyRole, 'userRole')
        ->create();
    $otherAgencyUser = User::factory()
        ->for($otherRegion)
        ->for($agencyRole, 'userRole')
        ->create();
    $incident = Incident::factory()->for($centralRegion)->create(['status' => 'Pending']);

    $this->actingAs($centralUser)
        ->put(route('incidents.routing.update', $incident), [
            'region_ids' => [$targetRegion->id],
        ])
        ->assertRedirect();

    $this->actingAs($centralUser)
        ->get(route('incidents.show', $incident))
        ->assertInertia(fn (Assert $page) => $page
            ->where('routing.can_manage', true)
            ->where('routing.origin_region', Region::CentralOffice)
            ->where('routing.routed_regions.0.id', $targetRegion->id)
            ->where('routing.available_regions', function ($regions) use (
                $centralRegion,
                $otherRegion,
                $targetRegion,
            ): bool {
                $regionIds = collect($regions)->pluck('id');

                return $regionIds->contains($targetRegion->id)
                    && $regionIds->contains($otherRegion->id)
                    && ! $regionIds->contains($centralRegion->id);
            })
        );

    $this->actingAs($regionalUser)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Regional Office response'])
        ->assertRedirect();

    $this->actingAs($agencyUser)
        ->post(route('incidents.messages.store', $incident), ['message' => 'Agency response'])
        ->assertForbidden();

    $this->actingAs($otherAgencyUser)
        ->get(route('incidents.show', $incident))
        ->assertForbidden();

    expect($incident->messages()->pluck('message')->all())->toBe(['Regional Office response']);
});

test('only accessible central and regional office administrators can manage incident status', function () {
    $centralRegion = Region::query()->firstOrCreate(['name' => Region::CentralOffice]);
    $regionalOffice = Region::factory()->create();
    $regionalAdministratorRole = UserRole::query()->create([
        'name' => UserRole::RegionalOfficeAdministrator,
    ]);
    $centralAdministratorRole = UserRole::query()->create([
        'name' => UserRole::CentralOfficeAdministrator,
    ]);
    $regionalStaffRole = UserRole::query()->create(['name' => UserRole::RegionalOfficeStaff]);
    $agencyRole = UserRole::query()->create(['name' => UserRole::Agency]);
    $regionalAdministrator = User::factory()
        ->for($regionalOffice)
        ->for($regionalAdministratorRole, 'userRole')
        ->create();
    $centralAdministrator = User::factory()
        ->for($centralRegion)
        ->for($centralAdministratorRole, 'userRole')
        ->create();
    $regionalStaff = User::factory()
        ->for($regionalOffice)
        ->for($regionalStaffRole, 'userRole')
        ->create();
    $agencyUser = User::factory()
        ->for($regionalOffice)
        ->for($agencyRole, 'userRole')
        ->create();
    $incident = Incident::factory()->for($regionalOffice)->create(['status' => 'Pending']);

    $this->actingAs($regionalAdministrator)
        ->put(route('incidents.routing.update', $incident), [
            'region_ids' => [$centralRegion->id],
        ])
        ->assertRedirect();

    $this->actingAs($regionalStaff)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Resolved'])
        ->assertForbidden();

    $this->actingAs($agencyUser)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Resolved'])
        ->assertForbidden();

    $this->actingAs($regionalAdministrator)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Resolved'])
        ->assertRedirect();

    $this->actingAs($centralAdministrator)
        ->patch(route('incidents.status.update', $incident), ['status' => 'Pending'])
        ->assertRedirect();

    $this->actingAs($regionalStaff)
        ->get(route('incidents.show', $incident))
        ->assertInertia(fn (Assert $page) => $page->where('incident.can_manage_status', false));

    $this->actingAs($centralAdministrator)
        ->get(route('incidents.show', $incident))
        ->assertInertia(fn (Assert $page) => $page->where('incident.can_manage_status', true));

    expect($incident->refresh()->status)->toBe('Pending');
});
