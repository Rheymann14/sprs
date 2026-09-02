import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Filter, List, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    index as rawListIndex,
    show as showRawIncident,
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

type Incident = {
    id: string;
    incident_number: string;
    incident_type: string;
    subcategory: string;
    region: string;
    status: string;
    created_at: string;
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
    const [filterValues, setFilterValues] = useState(filters);
    const selectedType = incidentTypes.find(
        (incidentType) => incidentType.id === filterValues.incident_type_id,
    );
    const query = {
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        incident_type_id: filters.incident_type_id || undefined,
        subcategory_id: filters.subcategory_id || undefined,
    };
    const hasFilters = Object.values(filters).some(Boolean);

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
                },
            }),
            {},
            { preserveScroll: true, preserveState: true, replace: true },
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
                                        <Link href={rawListIndex()}>
                                            <X /> Clear
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle>Incident submissions</CardTitle>
                            <Badge variant="secondary">{incidents.total}</Badge>
                        </div>
                        <CardDescription>
                            Open a row to view the answers saved when the report
                            was submitted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {incidents.data.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full min-w-4xl text-sm">
                                    <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                Date filed
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Incident number
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Incident type
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Subcategory
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Region
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {incidents.data.map((incident) => (
                                            <tr
                                                key={incident.id}
                                                className="transition-colors hover:bg-muted/40"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(
                                                        incident.created_at,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">
                                                    {incident.incident_number}
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {incident.incident_type}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {incident.subcategory}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {incident.region}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">
                                                        {incident.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={showRawIncident(
                                                                incident.id,
                                                            )}
                                                        >
                                                            <Eye /> View
                                                        </Link>
                                                    </Button>
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
