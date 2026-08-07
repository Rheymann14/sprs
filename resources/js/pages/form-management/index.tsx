import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    CalendarClock,
    CheckSquare,
    ChevronRight,
    CircleDot,
    Eye,
    FileUp,
    GripVertical,
    Hash,
    ListFilter,
    Pencil,
    Plus,
    Save,
    TextCursorInput,
    TextQuote,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { index as formManagement } from '@/actions/App/Http/Controllers/FormManagementController';
import { update as updateIncidentForm } from '@/actions/App/Http/Controllers/IncidentFormController';
import {
    destroy as destroySubcategory,
    store as storeSubcategory,
    update as updateSubcategory,
} from '@/actions/App/Http/Controllers/IncidentSubcategoryController';
import {
    destroy as destroyIncidentType,
    store as storeIncidentType,
    update as updateIncidentType,
} from '@/actions/App/Http/Controllers/IncidentTypeController';
import { SearchableCommand } from '@/components/searchable-command';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type FieldType =
    | 'text'
    | 'number'
    | 'datetime'
    | 'textarea'
    | 'dropdown'
    | 'file'
    | 'checkbox'
    | 'radio';

type StoredField = {
    id: string;
    type: FieldType;
    label: string;
    description: string | null;
    placeholder: string | null;
    is_required: boolean;
    options: Array<{ id: string; label: string; value: string }>;
};

type StoredSection = {
    id: string;
    title: string;
    description: string | null;
    fields: StoredField[];
};

type IncidentSubcategory = {
    id: string;
    name: string;
    form: {
        id: string;
        title: string;
        description: string | null;
        sections: StoredSection[];
    } | null;
};

type IncidentType = {
    id: string;
    name: string;
    subcategories: IncidentSubcategory[];
};

type EditorField = {
    client_key: string;
    type: FieldType;
    label: string;
    description: string;
    placeholder: string;
    is_required: boolean;
    options: string[];
};

type EditorSection = {
    client_key: string;
    title: string;
    description: string;
    fields: EditorField[];
};

type EditorForm = {
    title: string;
    description: string;
    sections: EditorSection[];
};

type FieldTypeOption = {
    value: FieldType;
    label: string;
};

type PageProps = {
    incidentTypes: IncidentType[];
    fieldTypes: FieldTypeOption[];
};

const fieldIcons = {
    text: TextCursorInput,
    number: Hash,
    datetime: CalendarClock,
    textarea: TextQuote,
    dropdown: ListFilter,
    file: FileUp,
    checkbox: CheckSquare,
    radio: CircleDot,
};

function PreviewField({ field }: { field: EditorField }) {
    const fieldId = `preview-${field.client_key}`;

    return (
        <div className="space-y-2">
            <Label htmlFor={fieldId} className="flex items-center gap-1">
                {field.label || 'Untitled field'}
                {field.is_required && (
                    <span className="text-destructive" aria-hidden="true">
                        *
                    </span>
                )}
            </Label>
            {field.description && (
                <p className="text-sm text-muted-foreground">
                    {field.description}
                </p>
            )}
            {field.type === 'textarea' ? (
                <Textarea
                    id={fieldId}
                    placeholder={field.placeholder}
                    className="min-h-24"
                />
            ) : field.type === 'dropdown' ? (
                <select
                    id={fieldId}
                    defaultValue=""
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                    <option value="" disabled>
                        {field.placeholder || 'Select an option'}
                    </option>
                    {field.options.map((option, optionIndex) => (
                        <option
                            key={`${field.client_key}-${optionIndex}`}
                            value={option}
                        >
                            {option}
                        </option>
                    ))}
                </select>
            ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox />
                    {field.placeholder || 'Select if applicable'}
                </label>
            ) : field.type === 'radio' ? (
                <div className="grid gap-2">
                    {field.options.map((option, optionIndex) => (
                        <label
                            key={`${field.client_key}-${optionIndex}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <input
                                type="radio"
                                name={fieldId}
                                value={option}
                                className="size-4 accent-primary"
                            />
                            {option}
                        </label>
                    ))}
                </div>
            ) : (
                <Input
                    id={fieldId}
                    type={
                        field.type === 'datetime'
                            ? 'datetime-local'
                            : field.type
                    }
                    placeholder={field.placeholder}
                />
            )}
        </div>
    );
}

function FormPreview({ form }: { form: EditorForm }) {
    return (
        <div className="space-y-8 rounded-xl border bg-background p-5 sm:p-8">
            <div className="space-y-2 border-b pb-6">
                <h2 className="text-2xl font-semibold tracking-tight">
                    {form.title || 'Untitled form'}
                </h2>
                {form.description && (
                    <p className="text-sm text-muted-foreground">
                        {form.description}
                    </p>
                )}
            </div>

            {form.sections.map((section) => (
                <section key={section.client_key} className="space-y-5">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">
                            {section.title || 'Untitled section'}
                        </h3>
                        {section.description && (
                            <p className="text-sm text-muted-foreground">
                                {section.description}
                            </p>
                        )}
                    </div>
                    {section.fields.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            No fields in this section.
                        </p>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2">
                            {section.fields.map((field) => (
                                <PreviewField
                                    key={field.client_key}
                                    field={field}
                                />
                            ))}
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}

function createEmptySection(): EditorSection {
    return {
        client_key: crypto.randomUUID(),
        title: 'Incident details',
        description: '',
        fields: [],
    };
}

function createField(type: FieldType, label: string): EditorField {
    return {
        client_key: crypto.randomUUID(),
        type,
        label,
        description: '',
        placeholder: '',
        is_required: false,
        options:
            type === 'dropdown' || type === 'radio'
                ? ['Option 1', 'Option 2']
                : [],
    };
}

function normalizedEditorField(field: EditorField): EditorField {
    return {
        client_key: field.client_key,
        type: field.type,
        label: field.label,
        description: field.description,
        placeholder: field.placeholder,
        is_required: field.is_required,
        options: field.options,
    };
}

function normalizedEditorSection(section: EditorSection): EditorSection {
    return {
        client_key: section.client_key,
        title: section.title,
        description: section.description,
        fields: section.fields.map(normalizedEditorField),
    };
}

function scrollToEditorItem(elementId: string): void {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.getElementById(elementId)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        });
    });
}

function editorData(subcategory: IncidentSubcategory): EditorForm {
    if (!subcategory.form) {
        return {
            title: `${subcategory.name} incident form`,
            description: '',
            sections: [createEmptySection()],
        };
    }

    return {
        title: subcategory.form.title,
        description: subcategory.form.description ?? '',
        sections: subcategory.form.sections.map((section) => ({
            client_key: crypto.randomUUID(),
            title: section.title,
            description: section.description ?? '',
            fields: section.fields.map((field) => ({
                client_key: crypto.randomUUID(),
                type: field.type,
                label: field.label,
                description: field.description ?? '',
                placeholder: field.placeholder ?? '',
                is_required: field.is_required,
                options: field.options.map((option) => option.label),
            })),
        })),
    };
}

export default function FormManagement({
    incidentTypes,
    fieldTypes,
}: PageProps) {
    const [selectedIncidentTypeId, setSelectedIncidentTypeId] = useState('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [actionSectionKey, setActionSectionKey] = useState('');
    const [incidentTypeDialogOpen, setIncidentTypeDialogOpen] = useState(false);
    const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
    const [editingIncidentType, setEditingIncidentType] =
        useState<IncidentType | null>(null);
    const [editingSubcategory, setEditingSubcategory] =
        useState<IncidentSubcategory | null>(null);
    const [pendingFieldTypes, setPendingFieldTypes] = useState<
        Record<string, FieldType>
    >({});
    const [unsavedSectionKeys, setUnsavedSectionKeys] = useState<Set<string>>(
        () => new Set(),
    );
    const [unsavedFieldKeys, setUnsavedFieldKeys] = useState<Set<string>>(
        () => new Set(),
    );

    const incidentTypeForm = useForm({ name: '' });
    const createSubcategoryForm = useForm({ names: [''] });
    const editSubcategoryForm = useForm({ name: '' });
    const form = useForm<EditorForm>({
        title: '',
        description: '',
        sections: [createEmptySection()],
    });

    const selectedIncidentType = useMemo(
        () =>
            incidentTypes.find(
                (incidentType) => incidentType.id === selectedIncidentTypeId,
            ),
        [incidentTypes, selectedIncidentTypeId],
    );
    const selectedSubcategory = selectedIncidentType?.subcategories.find(
        (subcategory) => subcategory.id === selectedSubcategoryId,
    );

    const incidentTypeOptions = incidentTypes.map((incidentType) => ({
        value: incidentType.id,
        label: incidentType.name,
    }));
    const subcategoryOptions =
        selectedIncidentType?.subcategories.map((subcategory) => ({
            value: subcategory.id,
            label: subcategory.name,
        })) ?? [];
    const fieldTypeOptions = fieldTypes.map((fieldType) => ({
        ...fieldType,
        icon: fieldIcons[fieldType.value],
    }));
    const activeActionSectionKey = form.data.sections.some(
        (section) => section.client_key === actionSectionKey,
    )
        ? actionSectionKey
        : (form.data.sections[0]?.client_key ?? '');
    const sectionOptions = form.data.sections.map((section, index) => ({
        value: section.client_key,
        label: section.title || `Section ${index + 1}`,
    }));

    const markSectionUnsaved = (sectionKey: string) => {
        setUnsavedSectionKeys((current) => {
            if (current.has(sectionKey)) {
                return current;
            }

            return new Set(current).add(sectionKey);
        });
    };

    const markFieldUnsaved = (fieldKey: string) => {
        setUnsavedFieldKeys((current) => {
            if (current.has(fieldKey)) {
                return current;
            }

            return new Set(current).add(fieldKey);
        });
    };

    const clearUnsavedItems = () => {
        setUnsavedSectionKeys(new Set());
        setUnsavedFieldKeys(new Set());
    };

    const openIncidentTypeDialog = (incidentType: IncidentType | null) => {
        setEditingIncidentType(incidentType);
        incidentTypeForm.setData('name', incidentType?.name ?? '');
        incidentTypeForm.clearErrors();
        setIncidentTypeDialogOpen(true);
    };

    const openSubcategoryDialog = (subcategory: IncidentSubcategory | null) => {
        setEditingSubcategory(subcategory);

        if (subcategory) {
            editSubcategoryForm.setData('name', subcategory.name);
            editSubcategoryForm.clearErrors();
        } else {
            createSubcategoryForm.setData('names', ['']);
            createSubcategoryForm.clearErrors();
        }

        setSubcategoryDialogOpen(true);
    };

    const submitIncidentType = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setIncidentTypeDialogOpen(false),
        };

        if (editingIncidentType) {
            incidentTypeForm.put(
                updateIncidentType.url(editingIncidentType.id),
                options,
            );

            return;
        }

        incidentTypeForm.post(storeIncidentType.url(), options);
    };

    const submitSubcategory = (event: FormEvent) => {
        event.preventDefault();

        if (!selectedIncidentType) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => setSubcategoryDialogOpen(false),
        };

        if (editingSubcategory) {
            editSubcategoryForm.put(
                updateSubcategory.url({
                    incident_type: selectedIncidentType.id,
                    subcategory: editingSubcategory.id,
                }),
                options,
            );

            return;
        }

        createSubcategoryForm.post(
            storeSubcategory.url(selectedIncidentType.id),
            options,
        );
    };

    const selectIncidentType = (incidentTypeId: string) => {
        setSelectedIncidentTypeId(incidentTypeId);
        setSelectedSubcategoryId('');
        setActionSectionKey('');
        clearUnsavedItems();
        form.reset();
        form.clearErrors();
    };

    const selectSubcategory = (subcategoryId: string) => {
        const subcategory = selectedIncidentType?.subcategories.find(
            (candidate) => candidate.id === subcategoryId,
        );

        if (!subcategory) {
            return;
        }

        const data = editorData(subcategory);

        setSelectedSubcategoryId(subcategoryId);
        setActionSectionKey(data.sections[0]?.client_key ?? '');
        clearUnsavedItems();
        form.setData(data);
        form.clearErrors();
    };

    const updateSection = (
        sectionIndex: number,
        key: 'title' | 'description',
        value: string,
    ) => {
        markSectionUnsaved(form.data.sections[sectionIndex].client_key);
        form.setData(
            'sections',
            form.data.sections.map((section, index) =>
                index === sectionIndex ? { ...section, [key]: value } : section,
            ),
        );
    };

    const updateField = <Key extends keyof EditorField>(
        sectionIndex: number,
        fieldIndex: number,
        key: Key,
        value: EditorField[Key],
    ) => {
        markFieldUnsaved(
            form.data.sections[sectionIndex].fields[fieldIndex].client_key,
        );
        form.setData(
            'sections',
            form.data.sections.map((section, index) =>
                index === sectionIndex
                    ? {
                          ...section,
                          fields: section.fields.map(
                              (field, currentFieldIndex) =>
                                  currentFieldIndex === fieldIndex
                                      ? { ...field, [key]: value }
                                      : field,
                          ),
                      }
                    : section,
            ),
        );
    };

    const moveSection = (sectionIndex: number, direction: -1 | 1) => {
        const destination = sectionIndex + direction;

        if (destination < 0 || destination >= form.data.sections.length) {
            return;
        }

        const sections = [...form.data.sections];
        [sections[sectionIndex], sections[destination]] = [
            sections[destination],
            sections[sectionIndex],
        ];
        markSectionUnsaved(sections[sectionIndex].client_key);
        markSectionUnsaved(sections[destination].client_key);
        form.setData('sections', sections);
    };

    const addField = (sectionIndex: number, sectionKey: string) => {
        const type = pendingFieldTypes[sectionKey] ?? 'text';
        const label =
            fieldTypes.find((fieldType) => fieldType.value === type)?.label ??
            'Field';
        const field = createField(type, label);

        markFieldUnsaved(field.client_key);
        form.setData(
            'sections',
            form.data.sections.map((section, index) =>
                index === sectionIndex
                    ? {
                          ...section,
                          fields: [...section.fields, field],
                      }
                    : section,
            ),
        );
        scrollToEditorItem(`field-${field.client_key}`);
    };

    const addSection = () => {
        const section = {
            ...createEmptySection(),
            title: `Section ${form.data.sections.length + 1}`,
        };

        form.setData('sections', [...form.data.sections, section]);
        setActionSectionKey(section.client_key);
        markSectionUnsaved(section.client_key);
        scrollToEditorItem(`section-${section.client_key}`);
    };

    const addFieldFromActions = () => {
        const sectionIndex = form.data.sections.findIndex(
            (section) => section.client_key === activeActionSectionKey,
        );

        if (sectionIndex === -1) {
            return;
        }

        addField(sectionIndex, activeActionSectionKey);
    };

    const moveField = (
        sectionIndex: number,
        fieldIndex: number,
        direction: -1 | 1,
    ) => {
        const destination = fieldIndex + direction;
        const section = form.data.sections[sectionIndex];

        if (
            !section ||
            destination < 0 ||
            destination >= section.fields.length
        ) {
            return;
        }

        const fields = [...section.fields];
        [fields[fieldIndex], fields[destination]] = [
            fields[destination],
            fields[fieldIndex],
        ];
        markFieldUnsaved(fields[fieldIndex].client_key);
        markFieldUnsaved(fields[destination].client_key);
        form.setData(
            'sections',
            form.data.sections.map((currentSection, index) =>
                index === sectionIndex
                    ? { ...currentSection, fields }
                    : currentSection,
            ),
        );
    };

    const removeField = (sectionIndex: number, fieldIndex: number) => {
        markSectionUnsaved(form.data.sections[sectionIndex].client_key);
        form.setData(
            'sections',
            form.data.sections.map((section, index) =>
                index === sectionIndex
                    ? {
                          ...section,
                          fields: section.fields.filter(
                              (_, indexToRemove) =>
                                  indexToRemove !== fieldIndex,
                          ),
                      }
                    : section,
            ),
        );
    };

    const saveForm = (event: FormEvent) => {
        event.preventDefault();

        if (!selectedSubcategory) {
            return;
        }

        form.put(updateIncidentForm.url(selectedSubcategory.id), {
            preserveScroll: true,
            onSuccess: clearUnsavedItems,
        });
    };

    const validationMessages = Object.values(form.errors);

    return (
        <>
            <Head title="Form Management" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Form Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Configure incident categories and build the fields
                        responders will complete.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Form assignment</CardTitle>
                        <CardDescription>
                            Select an incident type, then choose the subcategory
                            whose form you want to edit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Incident type</Label>
                            <div className="flex gap-2">
                                <SearchableCommand
                                    value={selectedIncidentTypeId}
                                    options={incidentTypeOptions}
                                    placeholder="Select incident type"
                                    searchPlaceholder="Search incident types..."
                                    emptyMessage="No incident types found."
                                    onValueChange={selectIncidentType}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    aria-label="Add incident type"
                                    onClick={() => openIncidentTypeDialog(null)}
                                >
                                    <Plus />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    aria-label="Edit incident type"
                                    disabled={!selectedIncidentType}
                                    onClick={() =>
                                        selectedIncidentType &&
                                        openIncidentTypeDialog(
                                            selectedIncidentType,
                                        )
                                    }
                                >
                                    <Pencil />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Incident subcategory</Label>
                            <div className="flex gap-2">
                                <SearchableCommand
                                    value={selectedSubcategoryId}
                                    options={subcategoryOptions}
                                    placeholder={
                                        selectedIncidentType
                                            ? 'Select subcategory'
                                            : 'Select an incident type first'
                                    }
                                    searchPlaceholder="Search subcategories..."
                                    emptyMessage="No subcategories found."
                                    disabled={!selectedIncidentType}
                                    onValueChange={selectSubcategory}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    aria-label="Add subcategory"
                                    disabled={!selectedIncidentType}
                                    onClick={() => openSubcategoryDialog(null)}
                                >
                                    <Plus />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    aria-label="Edit subcategory"
                                    disabled={!selectedSubcategory}
                                    onClick={() =>
                                        selectedSubcategory &&
                                        openSubcategoryDialog(
                                            selectedSubcategory,
                                        )
                                    }
                                >
                                    <Pencil />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!selectedSubcategory ? (
                    <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                        <div className="rounded-full bg-muted p-3">
                            <ListFilter className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">
                                Choose a form assignment
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                The builder will appear after you select an
                                incident type and subcategory.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form
                        onSubmit={saveForm}
                        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
                    >
                        <div className="min-w-0 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Form details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="form-title">
                                            Form title
                                        </Label>
                                        <Input
                                            id="form-title"
                                            value={form.data.title}
                                            onChange={(event) =>
                                                form.setData(
                                                    'title',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="form-description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="form-description"
                                            value={form.data.description}
                                            placeholder="Explain when this form should be used."
                                            onChange={(event) =>
                                                form.setData(
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <ReactSortable
                                list={form.data.sections.map((section) => ({
                                    ...section,
                                    id: section.client_key,
                                }))}
                                setList={(sections) => {
                                    const sortedSections = sections.map(
                                        normalizedEditorSection,
                                    );

                                    sortedSections.forEach((section, index) => {
                                        if (
                                            form.data.sections[index]
                                                ?.client_key !==
                                            section.client_key
                                        ) {
                                            markSectionUnsaved(
                                                section.client_key,
                                            );
                                        }
                                    });
                                    form.setData('sections', sortedSections);
                                }}
                                animation={180}
                                handle=".section-drag-handle"
                                ghostClass="opacity-50"
                                className="space-y-5"
                            >
                                {form.data.sections.map(
                                    (section, sectionIndex) => (
                                        <Card
                                            key={section.client_key}
                                            id={`section-${section.client_key}`}
                                            className={cn(
                                                'scroll-mt-4 overflow-visible transition-colors',
                                                unsavedSectionKeys.has(
                                                    section.client_key,
                                                ) &&
                                                    'border-amber-400 bg-amber-50/40 dark:border-amber-500/70 dark:bg-amber-950/15',
                                            )}
                                        >
                                            <CardHeader className="border-b pb-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="grid flex-1 gap-3">
                                                        <button
                                                            type="button"
                                                            className="section-drag-handle flex w-fit cursor-grab touch-none items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                                                            aria-label={`Drag section ${sectionIndex + 1} to reorder`}
                                                        >
                                                            <GripVertical className="size-4 text-muted-foreground" />
                                                            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                                Section{' '}
                                                                {sectionIndex +
                                                                    1}
                                                            </span>
                                                            {unsavedSectionKeys.has(
                                                                section.client_key,
                                                            ) && (
                                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-normal text-amber-800 normal-case dark:bg-amber-900/60 dark:text-amber-200">
                                                                    Unsaved
                                                                </span>
                                                            )}
                                                        </button>
                                                        <Input
                                                            aria-label={`Section ${sectionIndex + 1} title`}
                                                            value={
                                                                section.title
                                                            }
                                                            className="text-base font-semibold"
                                                            onChange={(event) =>
                                                                updateSection(
                                                                    sectionIndex,
                                                                    'title',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <Textarea
                                                            aria-label={`Section ${sectionIndex + 1} description`}
                                                            value={
                                                                section.description
                                                            }
                                                            className="min-h-16"
                                                            placeholder="Optional section description"
                                                            onChange={(event) =>
                                                                updateSection(
                                                                    sectionIndex,
                                                                    'description',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex items-center self-end sm:self-start">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            aria-label="Move section up"
                                                            disabled={
                                                                sectionIndex ===
                                                                0
                                                            }
                                                            onClick={() =>
                                                                moveSection(
                                                                    sectionIndex,
                                                                    -1,
                                                                )
                                                            }
                                                        >
                                                            <ArrowUp />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            aria-label="Move section down"
                                                            disabled={
                                                                sectionIndex ===
                                                                form.data
                                                                    .sections
                                                                    .length -
                                                                    1
                                                            }
                                                            onClick={() =>
                                                                moveSection(
                                                                    sectionIndex,
                                                                    1,
                                                                )
                                                            }
                                                        >
                                                            <ArrowDown />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={
                                                                form.data
                                                                    .sections
                                                                    .length ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                form.setData(
                                                                    'sections',
                                                                    form.data.sections.filter(
                                                                        (
                                                                            _,
                                                                            index,
                                                                        ) =>
                                                                            index !==
                                                                            sectionIndex,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <Trash2 /> Remove
                                                            section
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {section.fields.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                                        This section has no
                                                        fields yet.
                                                    </div>
                                                ) : (
                                                    <ReactSortable
                                                        list={section.fields.map(
                                                            (field) => ({
                                                                ...field,
                                                                id: field.client_key,
                                                            }),
                                                        )}
                                                        setList={(fields) => {
                                                            const sortedFields =
                                                                fields.map(
                                                                    normalizedEditorField,
                                                                );

                                                            sortedFields.forEach(
                                                                (
                                                                    sortedField,
                                                                    index,
                                                                ) => {
                                                                    if (
                                                                        section
                                                                            .fields[
                                                                            index
                                                                        ]
                                                                            ?.client_key !==
                                                                        sortedField.client_key
                                                                    ) {
                                                                        markFieldUnsaved(
                                                                            sortedField.client_key,
                                                                        );
                                                                    }
                                                                },
                                                            );
                                                            form.setData(
                                                                'sections',
                                                                form.data.sections.map(
                                                                    (
                                                                        currentSection,
                                                                        index,
                                                                    ) =>
                                                                        index ===
                                                                        sectionIndex
                                                                            ? {
                                                                                  ...currentSection,
                                                                                  fields: sortedFields,
                                                                              }
                                                                            : currentSection,
                                                                ),
                                                            );
                                                        }}
                                                        animation={180}
                                                        handle=".field-drag-handle"
                                                        ghostClass="opacity-50"
                                                        className="space-y-4"
                                                    >
                                                        {section.fields.map(
                                                            (
                                                                field,
                                                                fieldIndex,
                                                            ) => {
                                                                const FieldIcon =
                                                                    fieldIcons[
                                                                        field
                                                                            .type
                                                                    ];
                                                                const hasOptions =
                                                                    field.type ===
                                                                        'dropdown' ||
                                                                    field.type ===
                                                                        'radio';

                                                                return (
                                                                    <div
                                                                        key={
                                                                            field.client_key
                                                                        }
                                                                        id={`field-${field.client_key}`}
                                                                        className={cn(
                                                                            'scroll-mt-4 rounded-lg border bg-muted/20 p-4 transition-colors',
                                                                            unsavedFieldKeys.has(
                                                                                field.client_key,
                                                                            ) &&
                                                                                'border-amber-400 bg-amber-50/70 dark:border-amber-500/70 dark:bg-amber-950/25',
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col gap-4">
                                                                            <div className="flex items-center justify-between gap-3">
                                                                                <div className="flex min-w-0 items-center gap-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="field-drag-handle cursor-grab touch-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                                                                                        aria-label={`Drag field ${fieldIndex + 1} to reorder`}
                                                                                    >
                                                                                        <GripVertical className="size-4 text-muted-foreground" />
                                                                                    </button>
                                                                                    <FieldIcon className="size-4 shrink-0 text-muted-foreground" />
                                                                                    <span className="truncate text-sm font-medium">
                                                                                        Field{' '}
                                                                                        {fieldIndex +
                                                                                            1}
                                                                                    </span>
                                                                                    {unsavedFieldKeys.has(
                                                                                        field.client_key,
                                                                                    ) && (
                                                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                                                                            Unsaved
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center">
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="icon"
                                                                                        variant="ghost"
                                                                                        aria-label="Move field up"
                                                                                        disabled={
                                                                                            fieldIndex ===
                                                                                            0
                                                                                        }
                                                                                        onClick={() =>
                                                                                            moveField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                                -1,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <ArrowUp />
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="icon"
                                                                                        variant="ghost"
                                                                                        aria-label="Move field down"
                                                                                        disabled={
                                                                                            fieldIndex ===
                                                                                            section
                                                                                                .fields
                                                                                                .length -
                                                                                                1
                                                                                        }
                                                                                        onClick={() =>
                                                                                            moveField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                                1,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <ArrowDown />
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="icon"
                                                                                        variant="ghost"
                                                                                        aria-label="Remove field"
                                                                                        onClick={() =>
                                                                                            removeField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Trash2 />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid gap-4 lg:grid-cols-2">
                                                                                <div className="space-y-2">
                                                                                    <Label>
                                                                                        Field
                                                                                        type
                                                                                    </Label>
                                                                                    <SearchableCommand
                                                                                        value={
                                                                                            field.type
                                                                                        }
                                                                                        options={
                                                                                            fieldTypeOptions
                                                                                        }
                                                                                        placeholder="Select field type"
                                                                                        onValueChange={(
                                                                                            value,
                                                                                        ) =>
                                                                                            updateField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                                'type',
                                                                                                value as FieldType,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label>
                                                                                        Label
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={
                                                                                            field.label
                                                                                        }
                                                                                        onChange={(
                                                                                            event,
                                                                                        ) =>
                                                                                            updateField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                                'label',
                                                                                                event
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label>
                                                                                        Help
                                                                                        text
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={
                                                                                            field.description
                                                                                        }
                                                                                        placeholder="Optional guidance"
                                                                                        onChange={(
                                                                                            event,
                                                                                        ) =>
                                                                                            updateField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                                'description',
                                                                                                event
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label>
                                                                                        Placeholder
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={
                                                                                            field.placeholder
                                                                                        }
                                                                                        disabled={
                                                                                            field.type ===
                                                                                                'checkbox' ||
                                                                                            field.type ===
                                                                                                'radio' ||
                                                                                            field.type ===
                                                                                                'file'
                                                                                        }
                                                                                        placeholder="Optional placeholder"
                                                                                        onChange={(
                                                                                            event,
                                                                                        ) =>
                                                                                            updateField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                                'placeholder',
                                                                                                event
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <label className="flex w-fit items-center gap-2 text-sm font-medium">
                                                                                <Checkbox
                                                                                    checked={
                                                                                        field.is_required
                                                                                    }
                                                                                    onCheckedChange={(
                                                                                        checked,
                                                                                    ) =>
                                                                                        updateField(
                                                                                            sectionIndex,
                                                                                            fieldIndex,
                                                                                            'is_required',
                                                                                            checked ===
                                                                                                true,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                Required
                                                                                field
                                                                            </label>

                                                                            {hasOptions && (
                                                                                <div className="space-y-3 rounded-md border p-3">
                                                                                    <Label>
                                                                                        Options
                                                                                    </Label>
                                                                                    {field.options.map(
                                                                                        (
                                                                                            option,
                                                                                            optionIndex,
                                                                                        ) => (
                                                                                            <div
                                                                                                key={`${field.client_key}-${optionIndex}`}
                                                                                                className="flex items-center gap-2"
                                                                                            >
                                                                                                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                                                                                                <Input
                                                                                                    value={
                                                                                                        option
                                                                                                    }
                                                                                                    aria-label={`Option ${optionIndex + 1}`}
                                                                                                    onChange={(
                                                                                                        event,
                                                                                                    ) => {
                                                                                                        const options =
                                                                                                            [
                                                                                                                ...field.options,
                                                                                                            ];
                                                                                                        options[
                                                                                                            optionIndex
                                                                                                        ] =
                                                                                                            event.target.value;
                                                                                                        updateField(
                                                                                                            sectionIndex,
                                                                                                            fieldIndex,
                                                                                                            'options',
                                                                                                            options,
                                                                                                        );
                                                                                                    }}
                                                                                                />
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    size="icon"
                                                                                                    variant="ghost"
                                                                                                    aria-label="Remove option"
                                                                                                    disabled={
                                                                                                        field
                                                                                                            .options
                                                                                                            .length <=
                                                                                                        2
                                                                                                    }
                                                                                                    onClick={() =>
                                                                                                        updateField(
                                                                                                            sectionIndex,
                                                                                                            fieldIndex,
                                                                                                            'options',
                                                                                                            field.options.filter(
                                                                                                                (
                                                                                                                    _,
                                                                                                                    index,
                                                                                                                ) =>
                                                                                                                    index !==
                                                                                                                    optionIndex,
                                                                                                            ),
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    <Trash2 />
                                                                                                </Button>
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() =>
                                                                                            updateField(
                                                                                                sectionIndex,
                                                                                                fieldIndex,
                                                                                                'options',
                                                                                                [
                                                                                                    ...field.options,
                                                                                                    `Option ${field.options.length + 1}`,
                                                                                                ],
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Plus />{' '}
                                                                                        Add
                                                                                        option
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </ReactSortable>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ),
                                )}
                            </ReactSortable>

                            {validationMessages.length > 0 && (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                                    <p className="font-medium">
                                        Please review these items:
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        {validationMessages.map(
                                            (message, index) => (
                                                <li key={`${message}-${index}`}>
                                                    {message}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <aside className="self-start xl:sticky xl:top-4 xl:z-10">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Form actions</CardTitle>
                                    <CardDescription>
                                        Preview, save, or add content without
                                        losing your place.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setPreviewOpen(true)}
                                    >
                                        <Eye /> Preview form
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={form.processing}
                                    >
                                        <Save />{' '}
                                        {form.processing
                                            ? 'Saving...'
                                            : 'Save form'}
                                    </Button>

                                    <Separator />

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-dashed"
                                        onClick={addSection}
                                    >
                                        <Plus /> Add section / separator
                                    </Button>

                                    <div className="grid gap-3">
                                        <div className="space-y-2">
                                            <Label>Add field to</Label>
                                            <SearchableCommand
                                                value={activeActionSectionKey}
                                                options={sectionOptions}
                                                placeholder="Select section"
                                                searchPlaceholder="Search sections..."
                                                onValueChange={
                                                    setActionSectionKey
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Field type</Label>
                                            <SearchableCommand
                                                value={
                                                    pendingFieldTypes[
                                                        activeActionSectionKey
                                                    ] ?? 'text'
                                                }
                                                options={fieldTypeOptions}
                                                placeholder="Select field type"
                                                onValueChange={(value) =>
                                                    setPendingFieldTypes(
                                                        (current) => ({
                                                            ...current,
                                                            [activeActionSectionKey]:
                                                                value as FieldType,
                                                        }),
                                                    )
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            className="w-full"
                                            onClick={addFieldFromActions}
                                        >
                                            <Plus /> Add field
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </form>
                )}
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Form preview</DialogTitle>
                        <DialogDescription>
                            This preview reflects your current unsaved changes.
                        </DialogDescription>
                    </DialogHeader>
                    <FormPreview form={form.data} />
                </DialogContent>
            </Dialog>

            <Dialog
                open={incidentTypeDialogOpen}
                onOpenChange={setIncidentTypeDialogOpen}
            >
                <DialogContent>
                    <form onSubmit={submitIncidentType} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {editingIncidentType
                                    ? 'Edit incident type'
                                    : 'Add incident type'}
                            </DialogTitle>
                            <DialogDescription>
                                Incident types are the top-level grouping for
                                managed forms.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="incident-type-name">Name</Label>
                            <Input
                                id="incident-type-name"
                                autoFocus
                                value={incidentTypeForm.data.name}
                                onChange={(event) =>
                                    incidentTypeForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                            />
                            {incidentTypeForm.errors.name && (
                                <p className="text-sm text-destructive">
                                    {incidentTypeForm.errors.name}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            {editingIncidentType && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="sm:mr-auto"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                'Delete this incident type and all of its subcategories and forms?',
                                            )
                                        ) {
                                            router.delete(
                                                destroyIncidentType(
                                                    editingIncidentType.id,
                                                ),
                                                {
                                                    onSuccess: () => {
                                                        setIncidentTypeDialogOpen(
                                                            false,
                                                        );
                                                        selectIncidentType('');
                                                    },
                                                },
                                            );
                                        }
                                    }}
                                >
                                    <Trash2 /> Delete
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={incidentTypeForm.processing}
                            >
                                {incidentTypeForm.processing
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={subcategoryDialogOpen}
                onOpenChange={setSubcategoryDialogOpen}
            >
                <DialogContent>
                    <form onSubmit={submitSubcategory} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSubcategory
                                    ? 'Edit subcategory'
                                    : 'Add subcategory'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSubcategory
                                    ? `This subcategory belongs to ${selectedIncidentType?.name}.`
                                    : `Add one or more subcategories under ${selectedIncidentType?.name}.`}
                            </DialogDescription>
                        </DialogHeader>
                        {editingSubcategory ? (
                            <div className="space-y-2">
                                <Label htmlFor="subcategory-name">Name</Label>
                                <Input
                                    id="subcategory-name"
                                    autoFocus
                                    value={editSubcategoryForm.data.name}
                                    onChange={(event) =>
                                        editSubcategoryForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                />
                                {editSubcategoryForm.errors.name && (
                                    <p className="text-sm text-destructive">
                                        {editSubcategoryForm.errors.name}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Subcategory names</Label>
                                    <span className="text-xs text-muted-foreground">
                                        Up to 25 at a time
                                    </span>
                                </div>
                                {createSubcategoryForm.data.names.map(
                                    (name, index) => {
                                        const error = (
                                            createSubcategoryForm.errors as Record<
                                                string,
                                                string
                                            >
                                        )[`names.${index}`];

                                        return (
                                            <div
                                                key={index}
                                                className="space-y-1.5"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        autoFocus={index === 0}
                                                        aria-label={`Subcategory ${index + 1}`}
                                                        value={name}
                                                        placeholder={`Subcategory ${index + 1}`}
                                                        onChange={(event) => {
                                                            const names = [
                                                                ...createSubcategoryForm
                                                                    .data.names,
                                                            ];
                                                            names[index] =
                                                                event.target.value;
                                                            createSubcategoryForm.setData(
                                                                'names',
                                                                names,
                                                            );
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        aria-label={`Remove subcategory ${index + 1}`}
                                                        disabled={
                                                            createSubcategoryForm
                                                                .data.names
                                                                .length === 1
                                                        }
                                                        onClick={() =>
                                                            createSubcategoryForm.setData(
                                                                'names',
                                                                createSubcategoryForm.data.names.filter(
                                                                    (
                                                                        _,
                                                                        currentIndex,
                                                                    ) =>
                                                                        currentIndex !==
                                                                        index,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                                {error && (
                                                    <p className="text-sm text-destructive">
                                                        {error}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                        createSubcategoryForm.data.names
                                            .length >= 25
                                    }
                                    onClick={() =>
                                        createSubcategoryForm.setData('names', [
                                            ...createSubcategoryForm.data.names,
                                            '',
                                        ])
                                    }
                                >
                                    <Plus /> Add another subcategory
                                </Button>
                                {createSubcategoryForm.errors.names && (
                                    <p className="text-sm text-destructive">
                                        {createSubcategoryForm.errors.names}
                                    </p>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            {editingSubcategory && selectedIncidentType && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="sm:mr-auto"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                'Delete this subcategory and its form?',
                                            )
                                        ) {
                                            router.delete(
                                                destroySubcategory({
                                                    incident_type:
                                                        selectedIncidentType.id,
                                                    subcategory:
                                                        editingSubcategory.id,
                                                }),
                                                {
                                                    onSuccess: () => {
                                                        setSubcategoryDialogOpen(
                                                            false,
                                                        );
                                                        setSelectedSubcategoryId(
                                                            '',
                                                        );
                                                    },
                                                },
                                            );
                                        }
                                    }}
                                >
                                    <Trash2 /> Delete
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={
                                    createSubcategoryForm.processing ||
                                    editSubcategoryForm.processing
                                }
                            >
                                {createSubcategoryForm.processing ||
                                editSubcategoryForm.processing
                                    ? 'Saving...'
                                    : editingSubcategory
                                      ? 'Save'
                                      : 'Add subcategories'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

FormManagement.layout = {
    breadcrumbs: [
        {
            title: 'Form Management',
            href: formManagement(),
        },
    ],
};
