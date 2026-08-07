<?php

use App\Enums\FormFieldType;
use App\Models\FormField;
use App\Models\FormFieldOption;
use App\Models\FormSection;
use App\Models\IncidentForm;
use App\Models\IncidentSubcategory;
use App\Models\IncidentType;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function administrator(): User
{
    $role = UserRole::query()->firstOrCreate(['name' => UserRole::Administrator]);

    return User::factory()->for($role, 'userRole')->create();
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
    $incidentType = IncidentType::factory()->create(['name' => 'Fire']);
    $subcategory = IncidentSubcategory::factory()
        ->for($incidentType)
        ->create(['name' => 'Structural fire']);
    $form = IncidentForm::factory()->for($subcategory, 'subcategory')->create();
    $section = FormSection::factory()->for($form, 'form')->create();
    $field = FormField::factory()->for($section, 'section')->create([
        'type' => FormFieldType::Dropdown,
    ]);
    FormFieldOption::factory()->for($field, 'field')->create(['label' => 'Residential']);

    $this->actingAs(administrator())
        ->get(route('form-management.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('form-management/index')
            ->where('incidentTypes.0.name', 'Fire')
            ->where('incidentTypes.0.subcategories.0.name', 'Structural fire')
            ->where('incidentTypes.0.subcategories.0.form.sections.0.fields.0.options.0.label', 'Residential')
            ->has('fieldTypes', 8)
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

    $response = $this->actingAs(administrator())
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
        ->and($form->sections)->toHaveCount(1)
        ->and($form->sections->first()->fields)->toHaveCount(2)
        ->and($form->sections->first()->fields->last()->options)->toHaveCount(2)
        ->and(IncidentForm::query()->count())->toBe(1)
        ->and(FormSection::query()->count())->toBe(1)
        ->and(FormField::query()->count())->toBe(2)
        ->and(FormFieldOption::query()->count())->toBe(2);
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
});
