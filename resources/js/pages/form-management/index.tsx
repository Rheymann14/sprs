import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    CalendarClock,
    CheckSquare,
    ChevronRight,
    CircleDot,
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
    const [incidentTypeDialogOpen, setIncidentTypeDialogOpen] = useState(false);
    const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
    const [editingIncidentType, setEditingIncidentType] =
        useState<IncidentType | null>(null);
    const [editingSubcategory, setEditingSubcategory] =
        useState<IncidentSubcategory | null>(null);
    const [pendingFieldTypes, setPendingFieldTypes] = useState<
        Record<string, FieldType>
    >({});

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

        setSelectedSubcategoryId(subcategoryId);
        form.setData(editorData(subcategory));
        form.clearErrors();
    };

    const updateSection = (
        sectionIndex: number,
        key: 'title' | 'description',
        value: string,
    ) => {
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

    const addField = (sectionIndex: number, sectionKey: string) => {
        const type = pendingFieldTypes[sectionKey] ?? 'text';
        const label =
            fieldTypes.find((fieldType) => fieldType.value === type)?.label ??
            'Field';
        form.setData(
            'sections',
            form.data.sections.map((section, index) =>
                index === sectionIndex
                    ? {
                          ...section,
                          fields: [...section.fields, createField(type, label)],
                      }
                    : section,
            ),
        );
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
                    <form onSubmit={saveForm} className="space-y-6">
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

                        <div className="space-y-5">
                            {form.data.sections.map((section, sectionIndex) => (
                                <Card
                                    key={section.client_key}
                                    className="overflow-visible"
                                >
                                    <CardHeader className="border-b">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="grid flex-1 gap-3">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="size-4 text-muted-foreground" />
                                                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                        Section{' '}
                                                        {sectionIndex + 1}
                                                    </span>
                                                </div>
                                                <Input
                                                    aria-label={`Section ${sectionIndex + 1} title`}
                                                    value={section.title}
                                                    className="text-base font-semibold"
                                                    onChange={(event) =>
                                                        updateSection(
                                                            sectionIndex,
                                                            'title',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <Textarea
                                                    aria-label={`Section ${sectionIndex + 1} description`}
                                                    value={section.description}
                                                    className="min-h-16"
                                                    placeholder="Optional section description"
                                                    onChange={(event) =>
                                                        updateSection(
                                                            sectionIndex,
                                                            'description',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                disabled={
                                                    form.data.sections
                                                        .length === 1
                                                }
                                                onClick={() =>
                                                    form.setData(
                                                        'sections',
                                                        form.data.sections.filter(
                                                            (_, index) =>
                                                                index !==
                                                                sectionIndex,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 /> Remove section
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {section.fields.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                                This section has no fields yet.
                                            </div>
                                        ) : (
                                            section.fields.map(
                                                (field, fieldIndex) => {
                                                    const FieldIcon =
                                                        fieldIcons[field.type];
                                                    const hasOptions =
                                                        field.type ===
                                                            'dropdown' ||
                                                        field.type === 'radio';

                                                    return (
                                                        <div
                                                            key={
                                                                field.client_key
                                                            }
                                                            className="rounded-lg border bg-muted/20 p-4"
                                                        >
                                                            <div className="flex flex-col gap-4">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                        <FieldIcon className="size-4 shrink-0 text-muted-foreground" />
                                                                        <span className="truncate text-sm font-medium">
                                                                            Field{' '}
                                                                            {fieldIndex +
                                                                                1}
                                                                        </span>
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
                                                                                fieldTypes
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
                                            )
                                        )}

                                        <Separator />
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <SearchableCommand
                                                value={
                                                    pendingFieldTypes[
                                                        section.client_key
                                                    ] ?? 'text'
                                                }
                                                options={fieldTypes}
                                                placeholder="Select field type"
                                                onValueChange={(value) =>
                                                    setPendingFieldTypes(
                                                        (current) => ({
                                                            ...current,
                                                            [section.client_key]:
                                                                value as FieldType,
                                                        }),
                                                    )
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="sm:shrink-0"
                                                onClick={() =>
                                                    addField(
                                                        sectionIndex,
                                                        section.client_key,
                                                    )
                                                }
                                            >
                                                <Plus /> Add field
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() =>
                                form.setData('sections', [
                                    ...form.data.sections,
                                    {
                                        ...createEmptySection(),
                                        title: `Section ${form.data.sections.length + 1}`,
                                    },
                                ])
                            }
                        >
                            <Plus /> Add section / separator
                        </Button>

                        {validationMessages.length > 0 && (
                            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                                <p className="font-medium">
                                    Please fix the following:
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

                        <div className="sticky bottom-0 z-20 flex justify-end border-t bg-background py-4">
                            <Button type="submit" disabled={form.processing}>
                                <Save />{' '}
                                {form.processing ? 'Saving...' : 'Save form'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>

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
