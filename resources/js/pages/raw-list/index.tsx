import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    FileImage,
    FileText,
    List,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    download as exportRawList,
    index as rawListIndex,
} from '@/actions/App/Http/Controllers/RawIncidentController';
import Heading from '@/components/heading';
import { SearchableCommand } from '@/components/searchable-command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AnswerAttachment = {
    name: string;
    url: string;
    mime_type: string;
};

type SortColumn = 'created_at' | 'incident_number' | 'status';
type SortDirection = 'asc' | 'desc';

type Incident = {
    id: string;
    incident_number: string;
    incident_type: string;
    subcategory: string;
    region: string;
    status: string;
    created_at: string;
    answers: Array<{
        label: string;
        value: string;
        attachment: AnswerAttachment | null;
    }>;
};

type IncidentType = {
    id: string;
    name: string;
    subcategories: Array<{ id: string; name: string }>;
};

type Filters = {
    date_from: string;
    date_to: string;
    incident_type_id: string;
    subcategory_id: string;
    sort_by: SortColumn;
    sort_direction: SortDirection;
};

type PaginatedIncidents = {
    data: Incident[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

export default function RawList({
    incidents,
    incidentTypes,
    filters,
}: {
    incidents: PaginatedIncidents;
    incidentTypes: IncidentType[];
    filters: Filters;
}) {
    const [filterValues, setFilterValues] = useState({
        date_from: filters.date_from,
        date_to: filters.date_to,
        incident_type_id: filters.incident_type_id,
        subcategory_id: filters.subcategory_id,
    });
    const [viewingAttachment, setViewingAttachment] =
        useState<AnswerAttachment | null>(null);
    const selectedType = incidentTypes.find(
        (incidentType) => incidentType.id === filterValues.incident_type_id,
    );
    const query = {
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        incident_type_id: filters.incident_type_id || undefined,
        subcategory_id: filters.subcategory_id || undefined,
        sort_by: filters.sort_by,
        sort_direction: filters.sort_direction,
    };
    const hasFilters = Boolean(
        filters.date_from ||
        filters.date_to ||
        filters.incident_type_id ||
        filters.subcategory_id,
    );

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            rawListIndex.url({
                query: {
                    date_from: filterValues.date_from || undefined,
                    date_to: filterValues.date_to || undefined,
                    incident_type_id:
                        filterValues.incident_type_id || undefined,
                    subcategory_id: filterValues.subcategory_id || undefined,
                    sort_by: filters.sort_by,
                    sort_direction: filters.sort_direction,
                },
            }),
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const sortHref = (column: SortColumn) =>
        rawListIndex({
            query: {
                ...query,
                sort_by: column,
                sort_direction:
                    filters.sort_by === column &&
                    filters.sort_direction === 'asc'
                        ? 'desc'
                        : 'asc',
            },
        });

    const sortIcon = (column: SortColumn) => {
        if (filters.sort_by !== column) {
            return <ArrowUpDown className="size-3.5" />;
        }

        return filters.sort_direction === 'asc' ? (
            <ArrowUp className="size-3.5" />
        ) : (
            <ArrowDown className="size-3.5" />
        );
    };

    return (
        <>
            <Head title="Raw List" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Raw List"
                    description="Review incident submissions and their saved form answers."
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="size-5" /> Filters
                        </CardTitle>
                        <CardDescription>
                            Narrow incidents by filing date, incident type, and
                            subcategory.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end"
                            onSubmit={applyFilters}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="date-from">Date from</Label>
                                <Input
                                    id="date-from"
                                    type="date"
                                    value={filterValues.date_from}
                                    max={filterValues.date_to || undefined}
                                    onChange={(event) =>
                                        setFilterValues((current) => ({
                                            ...current,
                                            date_from: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date-to">Date to</Label>
                                <Input
                                    id="date-to"
                                    type="date"
                                    value={filterValues.date_to}
                                    min={filterValues.date_from || undefined}
                                    onChange={(event) =>
                                        setFilterValues((current) => ({
                                            ...current,
                                            date_to: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="incident-type">
                                    Incident type
                                </Label>
                                <SearchableCommand
                                    id="incident-type"
                                    value={filterValues.incident_type_id}
                                    options={[
                                        {
                                            value: '',
                                            label: 'All incident types',
                                        },
                                        ...incidentTypes.map(
                                            (incidentType) => ({
                                                value: incidentType.id,
                                                label: incidentType.name,
                                            }),
                                        ),
                                    ]}
                                    placeholder="All incident types"
                                    searchPlaceholder="Search incident types..."
                                    emptyMessage="No incident types found."
                                    onValueChange={(value) =>
                                        setFilterValues((current) => ({
                                            ...current,
                                            incident_type_id: value,
                                            subcategory_id: '',
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subcategory">Subcategory</Label>
                                <SearchableCommand
                                    id="subcategory"
                                    value={filterValues.subcategory_id}
                                    disabled={!selectedType}
                                    options={[
                                        {
                                            value: '',
                                            label: 'All subcategories',
                                        },
                                        ...(selectedType?.subcategories.map(
                                            (subcategory) => ({
                                                value: subcategory.id,
                                                label: subcategory.name,
                                            }),
                                        ) ?? []),
                                    ]}
                                    placeholder={
                                        selectedType
                                            ? 'All subcategories'
                                            : 'Select an incident type first'
                                    }
                                    searchPlaceholder="Search subcategories..."
                                    emptyMessage="No subcategories found."
                                    onValueChange={(value) =>
                                        setFilterValues((current) => ({
                                            ...current,
                                            subcategory_id: value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1">
                                    <Filter /> Apply
                                </Button>
                                {hasFilters && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                    >
                                        <Link
                                            href={rawListIndex({
                                                query: {
                                                    sort_by: filters.sort_by,
                                                    sort_direction:
                                                        filters.sort_direction,
                                                },
                                            })}
                                        >
                                            <X /> Clear
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <CardTitle>Incident submissions</CardTitle>
                                <Badge variant="secondary">
                                    {incidents.total}
                                </Badge>
                            </div>
                            <CardDescription>
                                Form answers are shown directly in each incident
                                row.
                            </CardDescription>
                        </div>
                        <Button asChild>
                            <a href={exportRawList.url({ query })}>
                                <Download /> Export to Excel
                            </a>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {incidents.data.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full min-w-6xl text-sm">
                                    <thead className="border-b border-blue-700 bg-blue-600 text-left text-xs tracking-wide text-white uppercase">
                                        <tr>
                                            <th className="border-r border-blue-500 px-4 py-3 font-semibold">
                                                <Link
                                                    href={sortHref(
                                                        'created_at',
                                                    )}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    Date filed
                                                    {sortIcon('created_at')}
                                                </Link>
                                            </th>
                                            <th className="border-r border-blue-500 px-4 py-3 font-semibold">
                                                <Link
                                                    href={sortHref(
                                                        'incident_number',
                                                    )}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    Incident number
                                                    {sortIcon(
                                                        'incident_number',
                                                    )}
                                                </Link>
                                            </th>
                                            <th className="border-r border-blue-500 px-4 py-3 font-semibold">
                                                Incident type
                                            </th>
                                            <th className="border-r border-blue-500 px-4 py-3 font-semibold">
                                                Subcategory
                                            </th>
                                            <th className="border-r border-blue-500 px-4 py-3 font-semibold">
                                                Region
                                            </th>
                                            <th className="border-r border-blue-500 px-4 py-3 font-semibold">
                                                <Link
                                                    href={sortHref('status')}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    Status
                                                    {sortIcon('status')}
                                                </Link>
                                            </th>
                                            <th className="px-4 py-3 font-semibold">
                                                Form answers
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {incidents.data.map((incident) => (
                                            <tr
                                                key={incident.id}
                                                className="align-top transition-colors hover:bg-muted/40"
                                            >
                                                <td className="border-r px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(
                                                        incident.created_at,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="border-r px-4 py-3 font-mono font-semibold whitespace-nowrap">
                                                    {incident.incident_number}
                                                </td>
                                                <td className="border-r px-4 py-3 font-medium">
                                                    {incident.incident_type}
                                                </td>
                                                <td className="border-r px-4 py-3 text-muted-foreground">
                                                    {incident.subcategory}
                                                </td>
                                                <td className="border-r px-4 py-3 text-muted-foreground">
                                                    {incident.region}
                                                </td>
                                                <td className="border-r px-4 py-3">
                                                    <Badge variant="outline">
                                                        {incident.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {incident.answers.length >
                                                    0 ? (
                                                        <dl className="min-w-72 space-y-1.5 text-xs">
                                                            {incident.answers.map(
                                                                (
                                                                    answer,
                                                                    answerIndex,
                                                                ) => (
                                                                    <div
                                                                        key={[
                                                                            answer.label,
                                                                            answerIndex,
                                                                        ].join(
                                                                            '-',
                                                                        )}
                                                                        className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-2"
                                                                    >
                                                                        <dt className="font-semibold text-foreground">
                                                                            {
                                                                                answer.label
                                                                            }
                                                                            :
                                                                        </dt>
                                                                        <dd className="min-w-0 break-words whitespace-pre-wrap text-muted-foreground">
                                                                            {answer.attachment ? (
                                                                                <button
                                                                                    type="button"
                                                                                    className="inline-flex max-w-full items-center gap-1.5 text-left font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-blue-400"
                                                                                    onClick={() =>
                                                                                        setViewingAttachment(
                                                                                            answer.attachment,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <FileImage className="size-3.5 shrink-0" />
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            answer.value
                                                                                        }
                                                                                    </span>
                                                                                </button>
                                                                            ) : (
                                                                                answer.value
                                                                            )}
                                                                        </dd>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </dl>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            No saved answers
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
                                <List className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        No incidents found
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Try changing or clearing the filters.
                                    </p>
                                </div>
                            </div>
                        )}

                        {incidents.last_page > 1 && (
                            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <p>
                                    Showing {incidents.from}–{incidents.to} of{' '}
                                    {incidents.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={incidents.current_page === 1}
                                        asChild={incidents.current_page > 1}
                                    >
                                        {incidents.current_page > 1 ? (
                                            <Link
                                                href={rawListIndex({
                                                    query: {
                                                        ...query,
                                                        page:
                                                            incidents.current_page -
                                                            1,
                                                    },
                                                })}
                                            >
                                                <ChevronLeft /> Previous
                                            </Link>
                                        ) : (
                                            <span>
                                                <ChevronLeft /> Previous
                                            </span>
                                        )}
                                    </Button>
                                    <span className="px-2">
                                        Page {incidents.current_page} of{' '}
                                        {incidents.last_page}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                            incidents.current_page ===
                                            incidents.last_page
                                        }
                                        asChild={
                                            incidents.current_page <
                                            incidents.last_page
                                        }
                                    >
                                        {incidents.current_page <
                                        incidents.last_page ? (
                                            <Link
                                                href={rawListIndex({
                                                    query: {
                                                        ...query,
                                                        page:
                                                            incidents.current_page +
                                                            1,
                                                    },
                                                })}
                                            >
                                                Next <ChevronRight />
                                            </Link>
                                        ) : (
                                            <span>
                                                Next <ChevronRight />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog
                    open={viewingAttachment !== null}
                    onOpenChange={(open) => !open && setViewingAttachment(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="truncate pr-8">
                                {viewingAttachment?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Uploaded form answer preview
                            </DialogDescription>
                        </DialogHeader>
                        {viewingAttachment && (
                            <div className="flex min-h-64 items-center justify-center overflow-auto rounded-lg border bg-muted/20">
                                {viewingAttachment.mime_type.startsWith(
                                    'image/',
                                ) ? (
                                    <img
                                        src={viewingAttachment.url}
                                        alt={viewingAttachment.name}
                                        className="max-h-[70vh] max-w-full object-contain"
                                    />
                                ) : viewingAttachment.mime_type ===
                                  'application/pdf' ? (
                                    <iframe
                                        src={viewingAttachment.url}
                                        title={viewingAttachment.name}
                                        className="h-[70vh] w-full"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                                        <FileText className="size-16 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            This file opens in your browser or
                                            its associated application.
                                        </p>
                                        <Button asChild>
                                            <a
                                                href={viewingAttachment.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download /> Open file
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
