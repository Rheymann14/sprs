import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    Clock3,
    FilePlus2,
    Pencil,
    Search,
    Siren,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    create as createIncident,
    destroy as destroyIncident,
    edit as editIncident,
    index as incidentsIndex,
} from '@/actions/App/Http/Controllers/IncidentController';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Incident = {
    id: string;
    incident_number: string;
    incident_type: string;
    subcategory: string;
    status: string;
    status_label: string;
    status_icon: StatusIcon;
};

type StatusIcon = 'circle-check' | 'clock' | 'circle-alert';

type PaginatedIncidents = {
    data: Incident[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type IncidentsProps = {
    incidents: PaginatedIncidents;
    filters: {
        search: string;
        year: number | null;
        incident_type_id: string;
        incident_type: string | null;
        subcategory_id: string;
        subcategory: string | null;
        status: string;
    };
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

export default function Incidents({ incidents, filters }: IncidentsProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search);
    const [deletingIncident, setDeletingIncident] = useState<Incident | null>(
        null,
    );
    const deletionForm = useForm({});
    const statisticsFilters = {
        year: filters.year ?? undefined,
        incident_type_id: filters.incident_type_id || undefined,
        subcategory_id: filters.subcategory_id || undefined,
        status: filters.status || undefined,
    };
    const hasStatisticsFilters = Boolean(
        filters.year ||
        filters.incident_type_id ||
        filters.subcategory_id ||
        filters.status,
    );

    const searchIncidents = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            incidentsIndex.url({
                query: {
                    ...statisticsFilters,
                    search: searchQuery.trim() || undefined,
                },
            }),
            {},
            {
                only: ['incidents', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearSearch = () => {
        setSearchQuery('');
        router.get(
            incidentsIndex.url({ query: statisticsFilters }),
            {},
            {
                only: ['incidents', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const deleteSelectedIncident = () => {
        if (!deletingIncident) {
            return;
        }

        deletionForm.delete(destroyIncident.url(deletingIncident.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingIncident(null),
        });
    };

    return (
        <>
            <Head title="Incidents" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Incidents"
                        description="Search and review incidents reported in your region."
                    />
                    <Button asChild>
                        <Link href={createIncident()}>
                            <FilePlus2 /> File Report
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <CardTitle>Incidents</CardTitle>
                                <Badge variant="secondary">
                                    {incidents.total}
                                </Badge>
                            </div>
                            <CardDescription>
                                Incident types, subcategories, and current
                                status.
                            </CardDescription>
                            {hasStatisticsFilters && (
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {filters.year && (
                                        <Badge variant="outline">
                                            Year: {filters.year}
                                        </Badge>
                                    )}
                                    {filters.incident_type && (
                                        <Badge variant="outline">
                                            Incident: {filters.incident_type}
                                        </Badge>
                                    )}
                                    {filters.subcategory && (
                                        <Badge variant="outline">
                                            Subcategory: {filters.subcategory}
                                        </Badge>
                                    )}
                                    {filters.status && (
                                        <Badge variant="outline">
                                            Status: {filters.status}
                                        </Badge>
                                    )}
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2"
                                    >
                                        <Link
                                            href={incidentsIndex({
                                                query: {
                                                    search:
                                                        filters.search ||
                                                        undefined,
                                                },
                                            })}
                                        >
                                            Clear report filters
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <form
                            className="flex w-full flex-wrap gap-2 sm:w-auto"
                            onSubmit={searchIncidents}
                        >
                            <Input
                                type="search"
                                value={searchQuery}
                                aria-label="Search incidents"
                                placeholder="Search incident, title, or status"
                                className="min-w-48 flex-1 sm:w-80"
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
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
                                    onClick={clearSearch}
                                >
                                    Clear
                                </Button>
                            )}
                        </form>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {incidents.data.length > 0 ? (
                            <>
                                <div className="hidden overflow-hidden rounded-xl border md:block">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-5 py-3.5 font-medium">
                                                    Incident
                                                </th>
                                                <th className="px-5 py-3.5 font-medium">
                                                    Title
                                                </th>
                                                <th className="px-5 py-3.5 font-medium">
                                                    Status
                                                </th>
                                                <th className="px-5 py-3.5 text-right font-medium">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {incidents.data.map((incident) => (
                                                <tr
                                                    key={incident.id}
                                                    className="transition-colors hover:bg-muted/40"
                                                >
                                                    <td className="px-5 py-4 font-mono font-semibold whitespace-nowrap">
                                                        {
                                                            incident.incident_number
                                                        }
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium">
                                                            {
                                                                incident.incident_type
                                                            }
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                                            {
                                                                incident.subcategory
                                                            }
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <IncidentStatusBadge
                                                            incident={incident}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={editIncident(
                                                                        incident.id,
                                                                    )}
                                                                >
                                                                    <Pencil />{' '}
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() =>
                                                                    setDeletingIncident(
                                                                        incident,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 />{' '}
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid gap-3 md:hidden">
                                    {incidents.data.map((incident) => (
                                        <article
                                            key={incident.id}
                                            className="rounded-xl border bg-card p-4 shadow-xs"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm font-semibold break-all">
                                                        {
                                                            incident.incident_number
                                                        }
                                                    </p>
                                                    <p className="mt-3 font-semibold">
                                                        {incident.incident_type}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {incident.subcategory}
                                                    </p>
                                                </div>
                                                <div className="shrink-0">
                                                    <IncidentStatusBadge
                                                        incident={incident}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <Link
                                                        href={editIncident(
                                                            incident.id,
                                                        )}
                                                    >
                                                        <Pencil /> Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        setDeletingIncident(
                                                            incident,
                                                        )
                                                    }
                                                >
                                                    <Trash2 /> Delete
                                                </Button>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-center sm:text-left">
                                        Showing {incidents.from}–{incidents.to}{' '}
                                        of {incidents.total}
                                    </p>
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                                        {incidents.current_page > 1 ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                            >
                                                <Link
                                                    href={incidentsIndex({
                                                        query: {
                                                            ...statisticsFilters,
                                                            search:
                                                                filters.search ||
                                                                undefined,
                                                            page:
                                                                incidents.current_page -
                                                                1,
                                                        },
                                                    })}
                                                    only={[
                                                        'incidents',
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
                                                className="w-full sm:w-auto"
                                            >
                                                <ChevronLeft /> Previous
                                            </Button>
                                        )}
                                        <span className="px-1 text-center whitespace-nowrap sm:px-2">
                                            Page {incidents.current_page} of{' '}
                                            {incidents.last_page}
                                        </span>
                                        {incidents.current_page <
                                        incidents.last_page ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                            >
                                                <Link
                                                    href={incidentsIndex({
                                                        query: {
                                                            ...statisticsFilters,
                                                            search:
                                                                filters.search ||
                                                                undefined,
                                                            page:
                                                                incidents.current_page +
                                                                1,
                                                        },
                                                    })}
                                                    only={[
                                                        'incidents',
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
                                                className="w-full sm:w-auto"
                                            >
                                                Next <ChevronRight />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
                                <div className="rounded-full bg-muted p-3">
                                    <Siren className="size-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {filters.search || hasStatisticsFilters
                                            ? 'No incidents found'
                                            : 'No incidents yet'}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {filters.search
                                            ? 'Try a different incident number, title, subcategory, or status.'
                                            : hasStatisticsFilters
                                              ? 'No incidents match the selected statistics filters.'
                                              : 'Incidents reported in your region will appear here.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog
                    open={deletingIncident !== null}
                    onOpenChange={(open) => {
                        if (!open && !deletionForm.processing) {
                            setDeletingIncident(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete incident?</DialogTitle>
                            <DialogDescription>
                                This permanently deletes{' '}
                                {deletingIncident?.incident_number} and its
                                saved report. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={deletionForm.processing}
                                onClick={() => setDeletingIncident(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deletionForm.processing}
                                onClick={deleteSelectedIncident}
                            >
                                <Trash2 />
                                {deletionForm.processing
                                    ? 'Deleting...'
                                    : 'Delete incident'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
