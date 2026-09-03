import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    Clock3,
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
type StatusIcon = 'circle-check' | 'clock' | 'circle-alert';

type Incident = {
    id: string;
    incident_number: string;
    incident_type: string;
    subcategory: string;
    region: string;
    status: string;
    status_label: string;
    status_icon: StatusIcon;
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

const statusAppearances = {
    'circle-check': {
        icon: CircleCheck,
        className:
            'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    clock: {
        icon: Clock3,
        className:
            'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
    },
    'circle-alert': {
        icon: CircleAlert,
        className:
            'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    },
} satisfies Record<StatusIcon, { icon: typeof CircleCheck; className: string }>;

function IncidentStatusBadge({ incident }: { incident: Incident }) {
    const appearance = statusAppearances[incident.status_icon];
    const StatusIcon = appearance.icon;

    return (
        <Badge variant="outline" className={appearance.className}>
            <StatusIcon /> {incident.status_label}
        </Badge>
    );
}

function IncidentAnswers({
    incident,
    onAttachmentClick,
    mobile = false,
}: {
    incident: Incident;
    onAttachmentClick: (attachment: AnswerAttachment) => void;
    mobile?: boolean;
}) {
    if (incident.answers.length === 0) {
        return (
            <span className="text-xs text-muted-foreground">
                No saved answers
            </span>
        );
    }

    return (
        <dl
            className={
                mobile ? 'grid gap-3 text-sm' : 'min-w-72 space-y-1.5 text-xs'
            }
        >
            {incident.answers.map((answer, answerIndex) => (
                <div
                    key={[answer.label, answerIndex].join('-')}
                    className={
                        mobile
                            ? 'grid min-w-0 gap-1'
                            : answer.attachment
                              ? 'grid gap-1'
                              : 'flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1'
                    }
                >
                    <dt className="max-w-full shrink-0 font-semibold break-words text-foreground">
                        {answer.label}:
                    </dt>
                    <dd
                        className={`min-w-0 break-words whitespace-pre-wrap text-muted-foreground ${!mobile && !answer.attachment ? 'min-w-72 flex-1' : ''}`}
                    >
                        {answer.attachment ? (
                            <button
                                type="button"
                                className="inline-flex max-w-full items-start gap-1.5 text-left font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-blue-400"
                                onClick={() =>
                                    onAttachmentClick(answer.attachment!)
                                }
                            >
                                <FileImage className="mt-px size-3.5 shrink-0" />
                                <span className="min-w-0 break-all whitespace-normal">
                                    {answer.value}
                                </span>
                            </button>
                        ) : (
                            answer.value
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

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
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="size-5" /> Filters
                        </CardTitle>
                        <CardDescription>
                            Narrow incidents by filing date, incident type, and
                            subcategory.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
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
                            <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 xl:col-span-1">
                                <Button type="submit" className="flex-1">
                                    <Filter /> Apply
                                </Button>
                                {hasFilters && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
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
                    <CardHeader className="gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
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
                        <Button className="w-full sm:w-auto" asChild>
                            <a href={exportRawList.url({ query })}>
                                <Download /> Export to Excel
                            </a>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                        {incidents.data.length > 0 ? (
                            <>
                                <div className="hidden overflow-x-auto rounded-xl border md:block">
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
                                                        href={sortHref(
                                                            'status',
                                                        )}
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
                                                        {
                                                            incident.incident_number
                                                        }
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
                                                        <IncidentStatusBadge
                                                            incident={incident}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <IncidentAnswers
                                                            incident={incident}
                                                            onAttachmentClick={
                                                                setViewingAttachment
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid gap-3 md:hidden">
                                    <div
                                        className="grid grid-cols-3 gap-2"
                                        aria-label="Sort incidents"
                                    >
                                        {(
                                            [
                                                ['created_at', 'Date'],
                                                ['incident_number', 'Incident'],
                                                ['status', 'Status'],
                                            ] as const
                                        ).map(([column, label]) => (
                                            <Button
                                                key={column}
                                                size="sm"
                                                variant={
                                                    filters.sort_by === column
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                                className="min-w-0 px-2"
                                                asChild
                                            >
                                                <Link
                                                    href={sortHref(column)}
                                                    aria-label={`Sort by ${label}`}
                                                >
                                                    <span className="truncate">
                                                        {label}
                                                    </span>
                                                    {sortIcon(column)}
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>

                                    {incidents.data.map((incident) => (
                                        <article
                                            key={incident.id}
                                            className="min-w-0 rounded-xl border bg-card p-4 shadow-xs"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm font-semibold break-all">
                                                        {
                                                            incident.incident_number
                                                        }
                                                    </p>
                                                    <time
                                                        dateTime={
                                                            incident.created_at
                                                        }
                                                        className="mt-1 block text-xs text-muted-foreground"
                                                    >
                                                        Filed{' '}
                                                        {new Date(
                                                            incident.created_at,
                                                        ).toLocaleDateString()}
                                                    </time>
                                                </div>
                                                <IncidentStatusBadge
                                                    incident={incident}
                                                />
                                            </div>

                                            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
                                                <div className="col-span-2 min-w-0">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Incident type
                                                    </dt>
                                                    <dd className="mt-1 font-medium break-words">
                                                        {incident.incident_type}
                                                    </dd>
                                                </div>
                                                <div className="min-w-0">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Subcategory
                                                    </dt>
                                                    <dd className="mt-1 break-words">
                                                        {incident.subcategory}
                                                    </dd>
                                                </div>
                                                <div className="min-w-0">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Region
                                                    </dt>
                                                    <dd className="mt-1 break-words">
                                                        {incident.region}
                                                    </dd>
                                                </div>
                                            </dl>

                                            <div className="mt-4 border-t pt-4">
                                                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Form answers
                                                </p>
                                                <IncidentAnswers
                                                    incident={incident}
                                                    onAttachmentClick={
                                                        setViewingAttachment
                                                    }
                                                    mobile
                                                />
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </>
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
                                <p className="text-center sm:text-left">
                                    Showing {incidents.from}–{incidents.to} of{' '}
                                    {incidents.total}
                                </p>
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full sm:w-auto"
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
                                    <span className="px-1 text-center whitespace-nowrap sm:px-2">
                                        Page {incidents.current_page} of{' '}
                                        {incidents.last_page}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full sm:w-auto"
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
