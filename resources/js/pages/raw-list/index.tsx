import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    answers: Array<{ label: string; value: string }>;
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

const selectClassName =
    'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30';

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
                                <select
                                    id="incident-type"
                                    className={selectClassName}
                                    value={filterValues.incident_type_id}
                                    onChange={(event) =>
                                        setFilterValues((current) => ({
                                            ...current,
                                            incident_type_id:
                                                event.target.value,
                                            subcategory_id: '',
                                        }))
                                    }
                                >
                                    <option value="">All incident types</option>
                                    {incidentTypes.map((incidentType) => (
                                        <option
                                            key={incidentType.id}
                                            value={incidentType.id}
                                        >
                                            {incidentType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subcategory">Subcategory</Label>
                                <select
                                    id="subcategory"
                                    className={selectClassName}
                                    value={filterValues.subcategory_id}
                                    disabled={!selectedType}
                                    onChange={(event) =>
                                        setFilterValues((current) => ({
                                            ...current,
                                            subcategory_id: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">All subcategories</option>
                                    {selectedType?.subcategories.map(
                                        (subcategory) => (
                                            <option
                                                key={subcategory.id}
                                                value={subcategory.id}
                                            >
                                                {subcategory.name}
                                            </option>
                                        ),
                                    )}
                                </select>
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
                                                                        <dd className="break-words whitespace-pre-wrap text-muted-foreground">
                                                                            {
                                                                                answer.value
                                                                            }
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
            </div>
        </>
    );
}
