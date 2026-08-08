<?php

use App\Enums\FormFieldType;
use App\Enums\IncidentStatusIcon;
use App\Models\FormField;
use App\Models\FormFieldOption;
use App\Models\FormSection;
use App\Models\IncidentForm;
use App\Models\IncidentStatus;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\Region;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function administrator(?Region $region = null): User
{
    $role = UserRole::query()->firstOrCreate(['name' => UserRole::Administrator]);
    $region ??= Region::factory()->create();

    return User::factory()->for($role, 'userRole')->for($region)->create();
}

test('guests are redirected from form management', function () {
    $this->get(route('form-management.index'))->assertRedirect(route('login'));
});

test('non administrators cannot manage forms', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('form-management.index'))
        ->assertForbidden();
});

test('administrators can view normalized form definitions', function () {
    $administrator = administrator();
    $incidentType = IncidentType::factory()->create(['name' => 'Fire']);
    $subcategory = IncidentSubcategory::factory()
        ->for($incidentType)
        ->create(['name' => 'Structural fire']);
    $form = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($administrator->region)
        ->create();
    $section = FormSection::factory()->for($form, 'form')->create();
    $field = FormField::factory()->for($section, 'section')->create([
        'type' => FormFieldType::Dropdown,
    ]);
    FormFieldOption::factory()->for($field, 'field')->create(['label' => 'Residential']);

    $this->actingAs($administrator)
        ->get(route('form-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('form-management/index')
            ->where('incidentTypes.0.name', 'Fire')
            ->where('incidentTypes.0.subcategories.0.name', 'Structural fire')
            ->where('incidentTypes.0.subcategories.0.statuses.0.name', 'Resolved')
            ->where('incidentTypes.0.subcategories.0.statuses.0.icon', IncidentStatusIcon::CircleCheck->value)
            ->where('incidentTypes.0.subcategories.0.statuses.1.name', 'Pending')
            ->where('incidentTypes.0.subcategories.0.statuses.2.name', 'Unresolved')
            ->where('incidentTypes.0.subcategories.0.form.sections.0.fields.0.options.0.label', 'Residential')
            ->has('fieldTypes', 8)
        );
});

test('administrators can customize up to three statuses for a subcategory', function () {
    $administrator = administrator();
    $incidentType = IncidentType::factory()->create();
    $subcategory = IncidentSubcategory::factory()->for($incidentType)->create();

    $this->actingAs($administrator)
        ->put(route('incident-types.subcategories.statuses.update', [$incidentType, $subcategory]), [
            'statuses' => [
                ['name' => 'Closed', 'icon' => IncidentStatusIcon::CircleCheck->value],
                ['name' => 'Under review', 'icon' => IncidentStatusIcon::Clock->value],
                ['name' => 'Escalated', 'icon' => IncidentStatusIcon::CircleAlert->value],
            ],
        ])
        ->assertRedirect(route('form-management.index', [
            'incident_type' => $incidentType->id,
            'subcategory' => $subcategory->id,
        ]))
        ->assertInertiaFlash('toast.message', 'Statuses saved.');

    expect($subcategory->statuses()->pluck('name')->all())->toBe([
        'Closed',
        'Under review',
        'Escalated',
    ])->and(IncidentStatus::query()->count())->toBe(3);

    $this->actingAs($administrator)
        ->get(route('form-management.index', [
            'incident_type' => $incidentType->id,
            'subcategory' => $subcategory->id,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidentTypes.0.subcategories.0.statuses.0.name', 'Closed')
            ->where('incidentTypes.0.subcategories.0.statuses.1.icon', IncidentStatusIcon::Clock->value)
            ->where('incidentTypes.0.subcategories.0.statuses.2.name', 'Escalated')
        );
});

test('status management rejects more than three statuses and invalid icons', function () {
    $incidentType = IncidentType::factory()->create();
    $subcategory = IncidentSubcategory::factory()->for($incidentType)->create();

    $this->actingAs(administrator())
        ->put(route('incident-types.subcategories.statuses.update', [$incidentType, $subcategory]), [
            'statuses' => [
                ['name' => 'One', 'icon' => IncidentStatusIcon::CircleCheck->value],
                ['name' => 'Two', 'icon' => IncidentStatusIcon::Clock->value],
                ['name' => 'Three', 'icon' => IncidentStatusIcon::CircleAlert->value],
                ['name' => 'Four', 'icon' => 'not-an-icon'],
            ],
        ])
        ->assertSessionHasErrors(['statuses', 'statuses.3.icon']);

    expect($subcategory->statuses()->doesntExist())->toBeTrue();
});

test('administrators can search and paginate saved forms and open an assignment', function () {
    $administrator = administrator();
    $incidentType = IncidentType::factory()->create(['name' => 'Medical Emergency']);
    $subcategory = IncidentSubcategory::factory()
        ->for($incidentType)
        ->create(['name' => 'Cardiac Response']);

    IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($administrator->region)
        ->create([
            'title' => 'Cardiac assessment',
            'created_at' => '2026-08-07 14:35:00',
        ]);

    IncidentForm::factory()
        ->count(10)
        ->for($administrator->region)
        ->create();

    $this->actingAs($administrator)
        ->get(route('form-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('savedForms.data', 10)
            ->where('savedForms.total', 11)
            ->where('savedForms.last_page', 2)
        );

    $this->actingAs($administrator)
        ->get(route('form-management.index', [
            'search' => 'cardiac',
            'incident_type' => $incidentType->id,
            'subcategory' => $subcategory->id,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.search', 'cardiac')
            ->where('selection.incident_type_id', $incidentType->id)
            ->where('selection.subcategory_id', $subcategory->id)
            ->has('savedForms.data', 1)
            ->where('savedForms.data.0.incident_type_name', 'Medical Emergency')
            ->where('savedForms.data.0.subcategory_name', 'Cardiac Response')
            ->where('savedForms.data.0.created_at_display', 'Aug 07, 2026 · 02:35 PM')
        );
});

test('saved forms can be filtered by incident type without selecting a subcategory', function () {
    $administrator = administrator();
    $selectedIncidentType = IncidentType::factory()->create(['name' => 'Fire']);
    $selectedSubcategory = IncidentSubcategory::factory()
        ->for($selectedIncidentType)
        ->create(['name' => 'Structural fire']);
    IncidentForm::factory()
        ->for($selectedSubcategory, 'subcategory')
        ->for($administrator->region)
        ->create();

    IncidentForm::factory()->for($administrator->region)->create();

    $this->actingAs($administrator)
        ->get(route('form-management.index', [
            'incident_type' => $selectedIncidentType->id,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('savedForms.data', 1)
            ->where('savedForms.data.0.incident_type_id', $selectedIncidentType->id)
            ->where('selection.incident_type_id', $selectedIncidentType->id)
            ->where('selection.subcategory_id', null)
        );
});

test('administrators can create and rename incident types and subcategories', function () {
    $administrator = administrator();

    $this->actingAs($administrator)
        ->post(route('incident-types.store'), ['name' => 'Medical'])
        ->assertRedirect(route('form-management.index'))
        ->assertInertiaFlash('toast.type', 'success')
        ->assertInertiaFlash('toast.message', 'Incident type created.');

    $incidentType = IncidentType::query()->where('name', 'Medical')->firstOrFail();

    $this->actingAs($administrator)
        ->put(route('incident-types.update', $incidentType), ['name' => 'Medical Emergency'])
        ->assertRedirect(route('form-management.index'))
        ->assertInertiaFlash('toast.message', 'Incident type updated.');

    $this->actingAs($administrator)
        ->post(route('incident-types.subcategories.store', $incidentType), [
            'names' => ['Trauma', 'Cardiac emergency'],
        ])
        ->assertRedirect(route('form-management.index'))
        ->assertInertiaFlash('toast.message', 'Subcategories created.');

    $subcategory = $incidentType->subcategories()->where('name', 'Trauma')->firstOrFail();

    $this->actingAs($administrator)
        ->put(route('incident-types.subcategories.update', [$incidentType, $subcategory]), [
            'name' => 'Major trauma',
        ])
        ->assertRedirect(route('form-management.index'))
        ->assertInertiaFlash('toast.message', 'Subcategory updated.');

    expect($incidentType->refresh()->name)->toBe('Medical Emergency')
        ->and($subcategory->refresh()->name)->toBe('Major trauma')
        ->and($incidentType->subcategories()->where('name', 'Cardiac emergency')->exists())->toBeTrue();
});

test('duplicate subcategory names in a batch are rejected', function () {
    $incidentType = IncidentType::factory()->create();

    $this->actingAs(administrator())
        ->post(route('incident-types.subcategories.store', $incidentType), [
            'names' => ['Vehicle collision', 'vehicle collision'],
        ])
        ->assertSessionHasErrors();

    expect($incidentType->subcategories()->doesntExist())->toBeTrue();
});

test('administrators can save a dynamic form into normalized tables', function () {
    $subcategory = IncidentSubcategory::factory()->create();
    $administrator = administrator();

    $response = $this->actingAs($administrator)
        ->put(route('incident-subcategories.form.update', $subcategory), [
            'title' => 'Flood assessment',
            'description' => 'Initial field assessment.',
            'sections' => [
                [
                    'client_key' => Str::uuid()->toString(),
                    'title' => 'Location',
                    'description' => null,
                    'fields' => [
                        [
                            'client_key' => Str::uuid()->toString(),
                            'type' => FormFieldType::Text->value,
                            'label' => 'Street address',
                            'description' => null,
                            'placeholder' => 'Enter address',
                            'is_required' => true,
                            'options' => [],
                        ],
                        [
                            'client_key' => Str::uuid()->toString(),
                            'type' => FormFieldType::Dropdown->value,
                            'label' => 'Water level',
                            'description' => 'Choose the closest level.',
                            'placeholder' => null,
                            'is_required' => true,
                            'options' => ['Below knee', 'Above knee'],
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertRedirect(route('form-management.index'))
        ->assertInertiaFlash('toast.type', 'success')
        ->assertInertiaFlash('toast.message', 'Form saved.');

    $form = IncidentForm::query()->with('sections.fields.options')->firstOrFail();

    expect($form->incident_subcategory_id)->toBe($subcategory->id)
        ->and($form->region_id)->toBe($administrator->region_id)
        ->and($form->sections)->toHaveCount(1)
        ->and($form->sections->first()->fields)->toHaveCount(2)
        ->and($form->sections->first()->fields->last()->options)->toHaveCount(2)
        ->and(IncidentForm::query()->count())->toBe(1)
        ->and(FormSection::query()->count())->toBe(1)
        ->and(FormField::query()->count())->toBe(2)
        ->and(FormFieldOption::query()->count())->toBe(2);
});

test('administrators only see and edit forms in their own region', function () {
    $firstRegion = Region::factory()->create();
    $secondRegion = Region::factory()->create();
    $firstAdministrator = administrator($firstRegion);
    $secondAdministrator = administrator($secondRegion);
    $subcategory = IncidentSubcategory::factory()->create();

    $firstForm = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($firstRegion)
        ->create(['title' => 'Region I form']);
    $secondForm = IncidentForm::factory()
        ->for($subcategory, 'subcategory')
        ->for($secondRegion)
        ->create(['title' => 'Region II form']);

    $this->actingAs($firstAdministrator)
        ->put(route('incident-subcategories.form.update', $subcategory), [
            'title' => 'Updated Region I form',
            'description' => null,
            'sections' => [
                [
                    'client_key' => Str::uuid()->toString(),
                    'title' => 'Regional details',
                    'description' => null,
                    'fields' => [],
                ],
            ],
        ])
        ->assertRedirect(route('form-management.index'));

    expect($firstForm->refresh()->title)->toBe('Updated Region I form')
        ->and($secondForm->refresh()->title)->toBe('Region II form');

    $this->actingAs($firstAdministrator)
        ->get(route('form-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('savedForms.total', 1)
            ->where('savedForms.data.0.id', $firstForm->id)
            ->where('incidentTypes.0.subcategories.0.form.id', $firstForm->id)
        );

    $this->actingAs($secondAdministrator)
        ->get(route('form-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('savedForms.total', 1)
            ->where('savedForms.data.0.id', $secondForm->id)
            ->where('incidentTypes.0.subcategories.0.form.id', $secondForm->id)
        );
});

test('dropdown and radio fields require at least two options', function (string $type) {
    $subcategory = IncidentSubcategory::factory()->create();

    $this->actingAs(administrator())
        ->put(route('incident-subcategories.form.update', $subcategory), [
            'title' => 'Invalid form',
            'description' => null,
            'sections' => [
                [
                    'client_key' => Str::uuid()->toString(),
                    'title' => 'Details',
                    'description' => null,
                    'fields' => [
                        [
                            'client_key' => Str::uuid()->toString(),
                            'type' => $type,
                            'label' => 'Choice',
                            'description' => null,
                            'placeholder' => null,
                            'is_required' => false,
                            'options' => ['Only one'],
                        ],
                    ],
                ],
            ],
        ])
        ->assertSessionHasErrors('sections.0.fields.0.options');

    expect(IncidentForm::query()->doesntExist())->toBeTrue();
})->with([
    FormFieldType::Dropdown->value,
    FormFieldType::Radio->value,
]);

test('form validation messages use plain language', function () {
    $subcategory = IncidentSubcategory::factory()->create();

    $this->actingAs(administrator())
        ->put(route('incident-subcategories.form.update', $subcategory), [
            'title' => '',
            'description' => null,
            'sections' => [
                [
                    'client_key' => Str::uuid()->toString(),
                    'title' => '',
                    'description' => null,
                    'fields' => [
                        [
                            'client_key' => Str::uuid()->toString(),
                            'type' => FormFieldType::Text->value,
                            'label' => '',
                            'description' => null,
                            'placeholder' => null,
                            'is_required' => false,
                            'options' => [],
                        ],
                    ],
                ],
            ],
        ])
        ->assertSessionHasErrors([
            'title' => 'Enter a form title.',
            'sections.0.title' => 'Enter a title for each section.',
            'sections.0.fields.0.label' => 'Enter a label for each field.',
        ]);
});

test('scoped subcategory routes reject a subcategory from another incident type', function () {
    $firstType = IncidentType::factory()->create();
    $otherSubcategory = IncidentSubcategory::factory()->create();

    $this->actingAs(administrator())
        ->put(route('incident-types.subcategories.update', [$firstType, $otherSubcategory]), [
            'name' => 'Should not update',
        ])
        ->assertNotFound();

    $this->actingAs(administrator())
        ->put(route('incident-types.subcategories.statuses.update', [$firstType, $otherSubcategory]), [
            'statuses' => IncidentStatus::defaults(),
        ])
        ->assertNotFound();
});
