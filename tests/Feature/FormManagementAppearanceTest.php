<?php

test('workflow cards use a shared subtle accent', function () {
    $page = file_get_contents(resource_path('js/pages/form-management/index.tsx'));

    expect($page)
        ->toContain(
            "'border-blue-200/80 bg-blue-50/40 dark:border-blue-900/70 dark:bg-blue-950/20'",
        )
        ->and(substr_count($page, 'className={workflowCardClassName}'))
        ->toBe(2);
});

test('form assignment exposes incident type and subcategory delete controls', function () {
    $page = file_get_contents(resource_path('js/pages/form-management/index.tsx'));

    expect($page)
        ->toContain('aria-label="Delete incident type"')
        ->toContain('aria-label="Delete subcategory"')
        ->toContain('requestIncidentTypeDeletion')
        ->toContain('requestSubcategoryDeletion');
});

test('deletions use a shadcn confirmation dialog', function () {
    $page = file_get_contents(resource_path('js/pages/form-management/index.tsx'));

    expect($page)
        ->toContain('Are you sure you want to delete')
        ->toContain('onClick={confirmDeletion}')
        ->toContain("deletionProcessing ? 'Deleting...' : 'Delete'")
        ->not->toContain('confirm(');
});

test('form assignment icon actions use shadcn tooltips', function () {
    $page = file_get_contents(resource_path('js/pages/form-management/index.tsx'));

    expect(substr_count($page, '<Tooltip>'))->toBe(6)
        ->and(substr_count($page, '<TooltipTrigger asChild>'))->toBe(6)
        ->and($page)->toContain('Add incident type')
        ->and($page)->toContain('Edit incident type')
        ->and($page)->toContain('Delete incident type')
        ->and($page)->toContain('Add subcategory')
        ->and($page)->toContain('Edit subcategory')
        ->and($page)->toContain('Delete subcategory');
});

test('saved incident forms display until a subcategory is selected', function () {
    $page = file_get_contents(resource_path('js/pages/form-management/index.tsx'));

    expect($page)
        ->toContain('const showSavedForms = !selectedSubcategory;')
        ->toContain('{showSavedForms ? (')
        ->toContain('incident_type: selectedIncidentTypeId || undefined');
});

test('adding fields uses the latest form state', function () {
    $page = file_get_contents(resource_path('js/pages/form-management/index.tsx'));

    expect($page)
        ->toContain('form.setData((currentData) => ({')
        ->toContain('sections: currentData.sections.map((section) =>')
        ->toContain('section.client_key === sectionKey')
        ->not->toContain('addField(sectionIndex, activeActionSectionKey)');
});
