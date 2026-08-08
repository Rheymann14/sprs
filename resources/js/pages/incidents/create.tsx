import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    index as incidentsIndex,
    store as storeIncident,
    update as updateIncident,
} from '@/actions/App/Http/Controllers/IncidentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

type FormOption = {
    id: string;
    label: string;
    value: string;
};

type ReportField = {
    id: string;
    type: FieldType;
    label: string;
    description: string | null;
    placeholder: string | null;
    is_required: boolean;
    options: FormOption[];
};

type ReportSection = {
    id: string;
    title: string;
    description: string | null;
    fields: ReportField[];
};

type ReportForm = {
    id: string;
    title: string;
    description: string | null;
    sections: ReportSection[];
};

type IncidentSubcategory = {
    id: string;
    name: string;
    forms: ReportForm[];
};

type IncidentType = {
    id: string;
    name: string;
    subcategories: IncidentSubcategory[];
};

type IncidentReportProps = {
    incidentTypes: IncidentType[];
    incident?: {
        id: string;
        incident_number: string;
        incident_type_id: string;
        incident_subcategory_id: string;
        responses: Record<string, ResponseValue>;
        existing_files: Record<string, string>;
    };
};

type ResponseValue = string | boolean | File | null;

type IncidentReportData = {
    incident_subcategory_id: string;
    responses: Record<string, ResponseValue>;
};

export default function CreateIncidentReport({
    incidentTypes,
    incident,
}: IncidentReportProps) {
    const isEditing = incident !== undefined;
    const [incidentTypeId, setIncidentTypeId] = useState(
        incident?.incident_type_id ?? '',
    );
    const [subcategoryId, setSubcategoryId] = useState(
        incident?.incident_subcategory_id ?? '',
    );
    const form = useForm<IncidentReportData>({
        incident_subcategory_id: incident?.incident_subcategory_id ?? '',
        responses: incident?.responses ?? {},
    });

    const selectedIncidentType = incidentTypes.find(
        (incidentType) => incidentType.id === incidentTypeId,
    );
    const selectedSubcategory = selectedIncidentType?.subcategories.find(
        (subcategory) => subcategory.id === subcategoryId,
    );
    const reportForm = selectedSubcategory?.forms[0];

    const incidentTypeOptions = incidentTypes.map((incidentType) => ({
        value: incidentType.id,
        label: incidentType.name,
    }));
    const subcategoryOptions = (selectedIncidentType?.subcategories ?? []).map(
        (subcategory) => ({
            value: subcategory.id,
            label: subcategory.name,
        }),
    );

    const selectIncidentType = (value: string) => {
        setIncidentTypeId(value);
        setSubcategoryId('');
        form.setData({
            incident_subcategory_id: '',
            responses: {},
        });
        form.clearErrors();
    };

    const selectSubcategory = (value: string) => {
        const subcategory = selectedIncidentType?.subcategories.find(
            (item) => item.id === value,
        );
        const initialResponses = Object.fromEntries(
            (subcategory?.forms[0]?.sections ?? []).flatMap((section) =>
                section.fields.map((field) => [
                    field.id,
                    field.type === 'checkbox' ? false : '',
                ]),
            ),
        );

        setSubcategoryId(value);
        form.setData({
            incident_subcategory_id: value,
            responses: initialResponses,
        });
        form.clearErrors();
    };

    const setResponse = (fieldId: string, value: ResponseValue) => {
        form.setData('responses', {
            ...form.data.responses,
            [fieldId]: value,
        });
        form.clearErrors(`responses.${fieldId}`);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (incident) {
            form.put(updateIncident.url(incident.id));

            return;
        }

        form.submit(storeIncident());
    };

    const renderField = (field: ReportField) => {
        const value = form.data.responses[field.id];
        const error = form.errors[`responses.${field.id}`];
        const inputId = `response-${field.id}`;

        if (field.type === 'textarea') {
            return (
                <Textarea
                    id={inputId}
                    value={typeof value === 'string' ? value : ''}
                    placeholder={field.placeholder ?? undefined}
                    aria-invalid={Boolean(error)}
                    rows={4}
                    onChange={(event) =>
                        setResponse(field.id, event.target.value)
                    }
                />
            );
        }

        if (field.type === 'dropdown') {
            return (
                <Select
                    value={typeof value === 'string' ? value : ''}
                    onValueChange={(nextValue) =>
                        setResponse(field.id, nextValue)
                    }
                >
                    <SelectTrigger id={inputId} className="w-full">
                        <SelectValue
                            placeholder={
                                field.placeholder ?? 'Select an option'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options.map((option) => (
                            <SelectItem key={option.id} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (field.type === 'radio') {
            return (
                <div className="grid gap-2">
                    {field.options.map((option) => (
                        <label
                            key={option.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                        >
                            <input
                                type="radio"
                                name={`responses[${field.id}]`}
                                value={option.value}
                                checked={value === option.value}
                                className="size-4 accent-primary"
                                onChange={() =>
                                    setResponse(field.id, option.value)
                                }
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            );
        }

        if (field.type === 'checkbox') {
            return (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Checkbox
                        id={inputId}
                        checked={value === true}
                        onCheckedChange={(checked) =>
                            setResponse(field.id, checked === true)
                        }
                    />
                    <Label htmlFor={inputId} className="font-normal">
                        Yes
                    </Label>
                </div>
            );
        }

        if (field.type === 'file') {
            return (
                <div className="grid gap-2">
                    <Input
                        id={inputId}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        aria-invalid={Boolean(error)}
                        onChange={(event) =>
                            setResponse(
                                field.id,
                                event.target.files?.[0] ?? null,
                            )
                        }
                    />
                    {incident?.existing_files[field.id] &&
                        (value === null ||
                            value === '' ||
                            value === undefined) && (
                            <p className="text-sm text-muted-foreground">
                                Current file:{' '}
                                {incident.existing_files[field.id]}
                            </p>
                        )}
                </div>
            );
        }

        return (
            <Input
                id={inputId}
                type={field.type === 'datetime' ? 'datetime-local' : field.type}
                value={typeof value === 'string' ? value : ''}
                placeholder={field.placeholder ?? undefined}
                aria-invalid={Boolean(error)}
                onChange={(event) => setResponse(field.id, event.target.value)}
            />
        );
    };

    return (
        <>
            <Head
                title={isEditing ? 'Edit Incident Report' : 'Incident Report'}
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={
                            isEditing
                                ? 'Edit Incident Report'
                                : 'Incident Report'
                        }
                        description={
                            isEditing
                                ? `Update the report details for ${incident?.incident_number}.`
                                : 'Choose an incident category, complete its report form, and submit it to your regional incident list.'
                        }
                    />
                    <Button asChild variant="outline">
                        <Link href={incidentsIndex()}>
                            <ArrowLeft /> Back to incidents
                        </Link>
                    </Button>
                </div>

                <form className="grid gap-6" onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Report classification</CardTitle>
                            <CardDescription>
                                Search for the incident type first, then choose
                                a matching subcategory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Incident Type</Label>
                                <SearchableCommand
                                    value={incidentTypeId}
                                    options={incidentTypeOptions}
                                    placeholder="Select incident type"
                                    searchPlaceholder="Search incident types"
                                    emptyMessage="No incident types with saved forms found."
                                    disabled={isEditing}
                                    onValueChange={selectIncidentType}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Subcategory</Label>
                                <SearchableCommand
                                    value={subcategoryId}
                                    options={subcategoryOptions}
                                    placeholder="Select subcategory"
                                    searchPlaceholder="Search subcategories"
                                    emptyMessage="No subcategories with saved forms found."
                                    disabled={!incidentTypeId || isEditing}
                                    onValueChange={selectSubcategory}
                                />
                            </div>
                            <InputError
                                className="md:col-span-2"
                                message={form.errors.incident_subcategory_id}
                            />
                        </CardContent>
                    </Card>

                    {reportForm ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                        <FileText className="size-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <CardTitle>
                                            {reportForm.title}
                                        </CardTitle>
                                        {reportForm.description && (
                                            <CardDescription>
                                                {reportForm.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                {reportForm.sections.map((section) => (
                                    <section
                                        key={section.id}
                                        className="grid gap-5 rounded-xl border p-4 md:p-5"
                                    >
                                        <div>
                                            <h2 className="font-semibold">
                                                {section.title}
                                            </h2>
                                            {section.description && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-5 md:grid-cols-2">
                                            {section.fields.map((field) => (
                                                <div
                                                    key={field.id}
                                                    className={
                                                        field.type ===
                                                            'textarea' ||
                                                        field.type === 'radio'
                                                            ? 'grid gap-2 md:col-span-2'
                                                            : 'grid gap-2'
                                                    }
                                                >
                                                    <Label
                                                        htmlFor={`response-${field.id}`}
                                                    >
                                                        {field.label}
                                                        {field.is_required && (
                                                            <span className="text-destructive">
                                                                {' '}
                                                                *
                                                            </span>
                                                        )}
                                                    </Label>
                                                    {field.description && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {field.description}
                                                        </p>
                                                    )}
                                                    {renderField(field)}
                                                    <InputError
                                                        message={
                                                            form.errors[
                                                                `responses.${field.id}`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                    >
                                        <Send />
                                        {form.processing
                                            ? isEditing
                                                ? 'Saving...'
                                                : 'Submitting...'
                                            : isEditing
                                              ? 'Save changes'
                                              : 'Submit report'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
                            <div className="rounded-full bg-muted p-3">
                                <FileText className="size-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    Select a report form
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    The saved form will appear here after you
                                    choose an incident type and subcategory.
                                </p>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}
