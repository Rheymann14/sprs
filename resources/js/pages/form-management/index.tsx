import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    CalendarClock,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    CircleDot,
    Clock3,
    Eye,
    FileUp,
    GripVertical,
    Hash,
    ListFilter,
    Pencil,
    Plus,
    Save,
    Search,
    Settings2,
    TextCursorInput,
    TextQuote,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { index as formManagement } from '@/actions/App/Http/Controllers/FormManagementController';
import { update as updateIncidentForm } from '@/actions/App/Http/Controllers/IncidentFormController';
import { update as updateIncidentStatuses } from '@/actions/App/Http/Controllers/IncidentStatusController';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
    statuses: IncidentStatus[];
    form: {
        id: string;
        title: string;
        description: string | null;
        sections: StoredSection[];
    } | null;
};

type StatusIcon = 'circle-check' | 'clock' | 'circle-alert';

type IncidentStatus = {
    name: string;
    icon: StatusIcon;
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
    region_id: string;
    title: string;
    description: string;
    sections: EditorSection[];
};

type FieldTypeOption = {
    value: FieldType;
    label: string;
};

type SavedForm = {
    id: string;
    incident_type_id: string;
    incident_type_name: string;
    subcategory_id: string;
    subcategory_name: string;
    created_at: string;
    created_at_display: string;
};

type PaginatedSavedForms = {
    data: SavedForm[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type PageProps = {
    incidentTypes: IncidentType[];
    fieldTypes: FieldTypeOption[];
    savedForms: PaginatedSavedForms;
    filters: {
        search: string;
        region_id: string;
    };
    regions: Array<{ id: string; name: string }>;
    selection: {
        incident_type_id: string | null;
        subcategory_id: string | null;
    };
};

type DeletionTarget =
    | { kind: 'incidentType'; incidentType: IncidentType }
    | {
          kind: 'subcategory';
          incidentTypeId: string;
          subcategory: IncidentSubcategory;
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

const workflowCardClassName =
    'border-blue-200/80 bg-blue-50/40 dark:border-blue-900/70 dark:bg-blue-950/20';

const defaultStatuses: IncidentStatus[] = [
    { name: 'Resolved', icon: 'circle-check' },
    { name: 'Pending', icon: 'clock' },
    { name: 'Unresolved', icon: 'circle-alert' },
];

const statusIconOptions = [
    {
        value: 'circle-check' as const,
        label: 'Resolved icon',
        icon: CircleCheck,
        className:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
        iconClassName: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        value: 'clock' as const,
        label: 'Pending icon',
        icon: Clock3,
        className:
            'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
        iconClassName: 'text-orange-600 dark:text-orange-400',
    },
    {
        value: 'circle-alert' as const,
        label: 'Unresolved icon',
        icon: CircleAlert,
        className:
            'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
        iconClassName: 'text-rose-600 dark:text-rose-400',
    },
];

function freshDefaultStatuses(): IncidentStatus[] {
    return defaultStatuses.map((status) => ({ ...status }));
}

function editableStatuses(statuses: IncidentStatus[]): IncidentStatus[] {
    return statuses.map(({ name, icon }) => ({ name, icon }));
}

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

function editorData(
    subcategory: IncidentSubcategory,
    regionId: string,
): EditorForm {
    if (!subcategory.form) {
        return {
            region_id: regionId,
            title: `${subcategory.name} incident form`,
            description: '',
            sections: [createEmptySection()],
        };
    }

    return {
        region_id: regionId,
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
    savedForms,
    filters,
    regions,
    selection,
}: PageProps) {
    const initialSubcategory = incidentTypes
        .find((incidentType) => incidentType.id === selection.incident_type_id)
        ?.subcategories.find(
            (subcategory) => subcategory.id === selection.subcategory_id,
        );
    const [selectedIncidentTypeId, setSelectedIncidentTypeId] = useState(
        selection.incident_type_id ?? '',
    );
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(
        initialSubcategory ? (selection.subcategory_id ?? '') : '',
    );
    const [savedFormSearch, setSavedFormSearch] = useState(filters.search);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [actionSectionKey, setActionSectionKey] = useState('');
    const [incidentTypeDialogOpen, setIncidentTypeDialogOpen] = useState(false);
    const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
    const [deletionTarget, setDeletionTarget] = useState<DeletionTarget | null>(
        null,
    );
    const [deletionProcessing, setDeletionProcessing] = useState(false);
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
    const statusForm = useForm<{ statuses: IncidentStatus[] }>({
        statuses: initialSubcategory
            ? editableStatuses(initialSubcategory.statuses)
            : freshDefaultStatuses(),
    });
    const form = useForm<EditorForm>({
        ...(initialSubcategory
            ? editorData(initialSubcategory, filters.region_id)
            : {
                  region_id: filters.region_id,
                  title: '',
                  description: '',
                  sections: [createEmptySection()],
              }),
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
    const showSavedForms = !selectedSubcategory;

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
        statusForm.setData('statuses', freshDefaultStatuses());
        statusForm.clearErrors();

        router.get(
            formManagement.url({
                query: {
                    incident_type: incidentTypeId || undefined,
                    search: savedFormSearch.trim() || undefined,
                    region_id: filters.region_id || undefined,
                },
            }),
            {},
            {
                only: ['savedForms', 'filters', 'selection'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const selectSubcategory = (subcategoryId: string) => {
        const subcategory = selectedIncidentType?.subcategories.find(
            (candidate) => candidate.id === subcategoryId,
        );

        if (!subcategory) {
            return;
        }

        const data = editorData(subcategory, filters.region_id);

        setSelectedSubcategoryId(subcategoryId);
        setActionSectionKey(data.sections[0]?.client_key ?? '');
        clearUnsavedItems();
        form.setData(data);
        form.clearErrors();
        statusForm.setData(
            'statuses',
            subcategory.statuses.length > 0
                ? editableStatuses(subcategory.statuses)
                : freshDefaultStatuses(),
        );
        statusForm.clearErrors();
    };

    const requestIncidentTypeDeletion = (incidentType: IncidentType) => {
        setDeletionTarget({ kind: 'incidentType', incidentType });
    };

    const requestSubcategoryDeletion = (subcategory: IncidentSubcategory) => {
        if (!selectedIncidentType) {
            return;
        }

        setDeletionTarget({
            kind: 'subcategory',
            incidentTypeId: selectedIncidentType.id,
            subcategory,
        });
    };

    const confirmDeletion = () => {
        if (!deletionTarget || deletionProcessing) {
            return;
        }

        setDeletionProcessing(true);

        if (deletionTarget.kind === 'incidentType') {
            router.delete(destroyIncidentType(deletionTarget.incidentType.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIncidentTypeDialogOpen(false);
                    setSelectedIncidentTypeId('');
                    setSelectedSubcategoryId('');
                    setActionSectionKey('');
                    clearUnsavedItems();
                    form.reset();
                    form.clearErrors();
                    setDeletionTarget(null);
                },
                onFinish: () => setDeletionProcessing(false),
            });

            return;
        }

        router.delete(
            destroySubcategory({
                incident_type: deletionTarget.incidentTypeId,
                subcategory: deletionTarget.subcategory.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubcategoryDialogOpen(false);
                    setSelectedSubcategoryId('');
                    setDeletionTarget(null);
                },
                onFinish: () => setDeletionProcessing(false),
            },
        );
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

    const updateStatus = <Key extends keyof IncidentStatus>(
        statusIndex: number,
        key: Key,
        value: IncidentStatus[Key],
    ) => {
        statusForm.setData(
            'statuses',
            statusForm.data.statuses.map((status, index) =>
                index === statusIndex ? { ...status, [key]: value } : status,
            ),
        );
    };

    const addStatus = () => {
        if (statusForm.data.statuses.length >= 3) {
            return;
        }

        const unusedIcon = statusIconOptions.find(
            (option) =>
                !statusForm.data.statuses.some(
                    (status) => status.icon === option.value,
                ),
        );

        statusForm.setData('statuses', [
            ...statusForm.data.statuses,
            {
                name: '',
                icon: unusedIcon?.value ?? 'circle-check',
            },
        ]);
    };

    const removeStatus = (statusIndex: number) => {
        if (statusForm.data.statuses.length === 1) {
            return;
        }

        statusForm.setData(
            'statuses',
            statusForm.data.statuses.filter(
                (_, index) => index !== statusIndex,
            ),
        );
    };

    const saveStatuses = () => {
        if (!selectedIncidentType || !selectedSubcategory) {
            return;
        }

        statusForm.transform(({ statuses }) => ({
            statuses: editableStatuses(statuses),
        }));
        statusForm.put(
            updateIncidentStatuses.url({
                incident_type: selectedIncidentType.id,
                subcategory: selectedSubcategory.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => setStatusDialogOpen(false),
            },
        );
    };

    const changeStatusDialogOpen = (open: boolean) => {
        if (!open && !statusForm.processing && selectedSubcategory) {
            statusForm.setData(
                'statuses',
                selectedSubcategory.statuses.length > 0
                    ? editableStatuses(selectedSubcategory.statuses)
                    : freshDefaultStatuses(),
            );
            statusForm.clearErrors();
        }

        setStatusDialogOpen(open);
    };

    const searchSavedForms = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            formManagement.url({
                query: {
                    incident_type: selectedIncidentTypeId || undefined,
                    search: savedFormSearch.trim() || undefined,
                    region_id: filters.region_id || undefined,
                },
            }),
            {},
            {
                only: ['savedForms', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearSavedFormSearch = () => {
        setSavedFormSearch('');
        router.get(
            formManagement.url({
                query: {
                    incident_type: selectedIncidentTypeId || undefined,
                    region_id: filters.region_id || undefined,
                },
            }),
            {},
            {
                only: ['savedForms', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const validationMessages = Object.values(form.errors);

    return (
        <>
            <Head title="Form Management" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Form Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure incident categories and build the fields
                            responders will complete.
                        </p>
                    </div>
                    {regions.length > 0 && (
                        <div className="w-full sm:w-64">
                            <SearchableCommand
                                value={filters.region_id}
                                options={regions.map((region) => ({
                                    value: region.id,
                                    label: region.name,
                                }))}
                                placeholder="Filter by region"
                                searchPlaceholder="Search regions..."
                                emptyMessage="No regions found."
                                onValueChange={(regionId) =>
                                    router.get(
                                        formManagement.url({
                                            query: { region_id: regionId },
                                        }),
                                    )
                                }
                            />
                        </div>
                    )}
                </div>

                <Card className={workflowCardClassName}>
                    <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1.5">
                            <CardTitle>Form assignment</CardTitle>
                            <CardDescription>
                                Select an incident type, then choose the
                                subcategory whose form you want to edit.
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={!selectedSubcategory}
                            onClick={() => setStatusDialogOpen(true)}
                        >
                            <Settings2 /> Manage statuses
                        </Button>
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
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            aria-label="Add incident type"
                                            onClick={() =>
                                                openIncidentTypeDialog(null)
                                            }
                                        >
                                            <Plus />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Add incident type
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
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
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Edit incident type
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                            aria-label="Delete incident type"
                                            disabled={!selectedIncidentType}
                                            onClick={() =>
                                                selectedIncidentType &&
                                                requestIncidentTypeDeletion(
                                                    selectedIncidentType,
                                                )
                                            }
                                        >
                                            <Trash2 />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Delete incident type
                                    </TooltipContent>
                                </Tooltip>
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
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            aria-label="Add subcategory"
                                            disabled={!selectedIncidentType}
                                            onClick={() =>
                                                openSubcategoryDialog(null)
                                            }
                                        >
                                            <Plus />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Add subcategory
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
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
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Edit subcategory
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                            aria-label="Delete subcategory"
                                            disabled={!selectedSubcategory}
                                            onClick={() =>
                                                selectedSubcategory &&
                                                requestSubcategoryDeletion(
                                                    selectedSubcategory,
                                                )
                                            }
                                        >
                                            <Trash2 />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Delete subcategory
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {showSavedForms ? (
                    <Card>
                        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="space-y-1.5">
                                <CardTitle>Saved incident forms</CardTitle>
                                <CardDescription>
                                    Select a saved assignment to open it in the
                                    form builder.
                                </CardDescription>
                            </div>
                            <form
                                onSubmit={searchSavedForms}
                                className="flex w-full gap-2 sm:w-auto"
                            >
                                <Input
                                    type="search"
                                    value={savedFormSearch}
                                    aria-label="Search saved incident forms"
                                    placeholder="Search incident type or subcategory"
                                    className="min-w-0 sm:w-72"
                                    onChange={(event) =>
                                        setSavedFormSearch(event.target.value)
                                    }
                                />
                                <Button type="submit" variant="outline">
                                    <Search />
                                    <span className="sr-only sm:not-sr-only">
                                        Search
                                    </span>
                                </Button>
                                {filters.search && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={clearSavedFormSearch}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </form>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {savedForms.data.length > 0 ? (
                                <>
                                    <div className="overflow-hidden rounded-lg border">
                                        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_14rem_2.5rem] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid">
                                            <span>Incident type</span>
                                            <span>Subcategory</span>
                                            <span>Date and time created</span>
                                            <span className="sr-only">
                                                Open form
                                            </span>
                                        </div>
                                        <div className="divide-y">
                                            {savedForms.data.map(
                                                (savedForm) => (
                                                    <Link
                                                        key={savedForm.id}
                                                        href={formManagement({
                                                            query: {
                                                                incident_type:
                                                                    savedForm.incident_type_id,
                                                                subcategory:
                                                                    savedForm.subcategory_id,
                                                                region_id:
                                                                    filters.region_id ||
                                                                    undefined,
                                                            },
                                                        })}
                                                        className="group grid gap-4 px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_14rem_2.5rem] md:items-center"
                                                        aria-label={`Open ${savedForm.incident_type_name}, ${savedForm.subcategory_name} form`}
                                                    >
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-medium text-muted-foreground md:hidden">
                                                                Incident type
                                                            </span>
                                                            <p className="truncate font-medium">
                                                                {
                                                                    savedForm.incident_type_name
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-medium text-muted-foreground md:hidden">
                                                                Subcategory
                                                            </span>
                                                            <p className="truncate text-sm">
                                                                {
                                                                    savedForm.subcategory_name
                                                                }
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-medium text-muted-foreground md:hidden">
                                                                Date and time
                                                                created
                                                            </span>
                                                            <time
                                                                dateTime={
                                                                    savedForm.created_at
                                                                }
                                                                className="block text-sm text-muted-foreground"
                                                            >
                                                                {
                                                                    savedForm.created_at_display
                                                                }
                                                            </time>
                                                        </div>
                                                        <ChevronRight className="hidden size-4 justify-self-end text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
                                                    </Link>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                        <p>
                                            Showing {savedForms.from}–
                                            {savedForms.to} of{' '}
                                            {savedForms.total}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {savedForms.current_page > 1 ? (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link
                                                        href={formManagement({
                                                            query: {
                                                                search:
                                                                    filters.search ||
                                                                    undefined,
                                                                incident_type:
                                                                    selectedIncidentTypeId ||
                                                                    undefined,
                                                                region_id:
                                                                    filters.region_id ||
                                                                    undefined,
                                                                page:
                                                                    savedForms.current_page -
                                                                    1,
                                                            },
                                                        })}
                                                        only={[
                                                            'savedForms',
                                                            'filters',
                                                        ]}
                                                        preserveScroll
                                                        preserveState
                                                    >
                                                        <ChevronLeft /> Previous
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled
                                                >
                                                    <ChevronLeft /> Previous
                                                </Button>
                                            )}
                                            <span className="px-2">
                                                Page {savedForms.current_page}{' '}
                                                of {savedForms.last_page}
                                            </span>
                                            {savedForms.current_page <
                                            savedForms.last_page ? (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link
                                                        href={formManagement({
                                                            query: {
                                                                search:
                                                                    filters.search ||
                                                                    undefined,
                                                                incident_type:
                                                                    selectedIncidentTypeId ||
                                                                    undefined,
                                                                region_id:
                                                                    filters.region_id ||
                                                                    undefined,
                                                                page:
                                                                    savedForms.current_page +
                                                                    1,
                                                            },
                                                        })}
                                                        only={[
                                                            'savedForms',
                                                            'filters',
                                                        ]}
                                                        preserveScroll
                                                        preserveState
                                                    >
                                                        Next <ChevronRight />
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled
                                                >
                                                    Next <ChevronRight />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                                    <div className="rounded-full bg-muted p-3">
                                        <ListFilter className="size-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {filters.search
                                                ? 'No saved forms found'
                                                : 'No saved forms yet'}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {filters.search
                                                ? 'Try a different incident type or subcategory.'
                                                : 'Select an assignment above to create its first form.'}
                                        </p>
                                    </div>
                                    {filters.search && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={clearSavedFormSearch}
                                        >
                                            Clear search
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <form
                        onSubmit={saveForm}
                        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
                    >
                        <Dialog
                            open={statusDialogOpen}
                            onOpenChange={changeStatusDialogOpen}
                        >
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Status management</DialogTitle>
                                    <DialogDescription>
                                        Customize up to three statuses and icons
                                        for {selectedIncidentType?.name} /{' '}
                                        {selectedSubcategory?.name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        disabled={
                                            statusForm.data.statuses.length >= 3
                                        }
                                        onClick={addStatus}
                                    >
                                        <Plus /> Add status
                                    </Button>
                                </div>
                                <div className="space-y-5">
                                    <div className="divide-y overflow-hidden rounded-lg border">
                                        {statusForm.data.statuses.map(
                                            (status, statusIndex) => {
                                                const selectedIcon =
                                                    statusIconOptions.find(
                                                        (option) =>
                                                            option.value ===
                                                            status.icon,
                                                    ) ?? statusIconOptions[0];
                                                const StatusIcon =
                                                    selectedIcon.icon;
                                                const statusErrors =
                                                    statusForm.errors as Record<
                                                        string,
                                                        string
                                                    >;

                                                return (
                                                    <article
                                                        key={statusIndex}
                                                        className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end"
                                                    >
                                                        <div className="space-y-2">
                                                            <Label
                                                                htmlFor={`status-name-${statusIndex}`}
                                                            >
                                                                Status{' '}
                                                                {statusIndex +
                                                                    1}
                                                            </Label>
                                                            <div className="flex gap-2">
                                                                <div
                                                                    className={cn(
                                                                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                                                        selectedIcon.className,
                                                                    )}
                                                                >
                                                                    <StatusIcon className="size-4" />
                                                                </div>
                                                                <Input
                                                                    id={`status-name-${statusIndex}`}
                                                                    value={
                                                                        status.name
                                                                    }
                                                                    placeholder="Enter status"
                                                                    maxLength={
                                                                        32
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateStatus(
                                                                            statusIndex,
                                                                            'name',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            {statusErrors[
                                                                `statuses.${statusIndex}.name`
                                                            ] && (
                                                                <p className="text-sm text-destructive">
                                                                    {
                                                                        statusErrors[
                                                                            `statuses.${statusIndex}.name`
                                                                        ]
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        <fieldset className="space-y-2">
                                                            <legend className="text-sm font-medium">
                                                                Icon
                                                            </legend>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {statusIconOptions.map(
                                                                    (
                                                                        option,
                                                                    ) => {
                                                                        const Icon =
                                                                            option.icon;

                                                                        return (
                                                                            <button
                                                                                key={
                                                                                    option.value
                                                                                }
                                                                                type="button"
                                                                                aria-label={
                                                                                    option.label
                                                                                }
                                                                                aria-pressed={
                                                                                    status.icon ===
                                                                                    option.value
                                                                                }
                                                                                className={cn(
                                                                                    'flex h-10 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                                                                                    status.icon ===
                                                                                        option.value
                                                                                        ? 'border-primary bg-primary/5'
                                                                                        : 'hover:bg-muted',
                                                                                )}
                                                                                onClick={() =>
                                                                                    updateStatus(
                                                                                        statusIndex,
                                                                                        'icon',
                                                                                        option.value,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Icon
                                                                                    className={cn(
                                                                                        'size-5',
                                                                                        option.iconClassName,
                                                                                    )}
                                                                                />
                                                                            </button>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </fieldset>

                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="justify-self-end text-muted-foreground hover:text-destructive md:justify-self-auto"
                                                            aria-label={`Remove ${status.name || `status ${statusIndex + 1}`}`}
                                                            disabled={
                                                                statusForm.data
                                                                    .statuses
                                                                    .length ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                removeStatus(
                                                                    statusIndex,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    </article>
                                                );
                                            },
                                        )}
                                    </div>

                                    {statusForm.errors.statuses && (
                                        <p className="text-sm text-destructive">
                                            {statusForm.errors.statuses}
                                        </p>
                                    )}

                                    <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            {statusForm.data.statuses.length} of
                                            3 statuses configured
                                        </p>
                                        <Button
                                            type="button"
                                            className="w-full sm:w-auto"
                                            disabled={statusForm.processing}
                                            onClick={saveStatuses}
                                        >
                                            <Save />{' '}
                                            {statusForm.processing
                                                ? 'Saving...'
                                                : 'Save statuses'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
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
                            <Card className={workflowCardClassName}>
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

                                    <Separator />

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
                                    onClick={() =>
                                        requestIncidentTypeDeletion(
                                            editingIncidentType,
                                        )
                                    }
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
                                    onClick={() =>
                                        requestSubcategoryDeletion(
                                            editingSubcategory,
                                        )
                                    }
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

            <Dialog
                open={deletionTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !deletionProcessing) {
                        setDeletionTarget(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete{' '}
                            {deletionTarget?.kind === 'incidentType'
                                ? 'incident type'
                                : 'subcategory'}
                            ?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-medium text-foreground">
                                {'"'}
                                {deletionTarget?.kind === 'incidentType'
                                    ? deletionTarget.incidentType.name
                                    : deletionTarget?.subcategory.name}
                                {'"'}
                            </span>
                            ?{' '}
                            {deletionTarget?.kind === 'incidentType'
                                ? 'All of its subcategories and forms will also be permanently deleted.'
                                : 'Its form will also be permanently deleted.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={deletionProcessing}
                            onClick={() => setDeletionTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deletionProcessing}
                            onClick={confirmDeletion}
                        >
                            <Trash2 />
                            {deletionProcessing ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
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
