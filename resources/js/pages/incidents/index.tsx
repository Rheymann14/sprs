import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search, Siren } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { index as incidentsIndex } from '@/actions/App/Http/Controllers/IncidentController';
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

type Incident = {
    id: string;
    incident_number: string;
    incident_type: string;
    subcategory: string;
    status: string;
    status_label: string;
};

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
    };
};

export default function Incidents({ incidents, filters }: IncidentsProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search);

    const searchIncidents = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            incidentsIndex.url({
                query: { search: searchQuery.trim() || undefined },
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
            incidentsIndex.url(),
            {},
            {
                only: ['incidents', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const statusVariant = (status: string) => {
        if (status === 'resolved') {
            return 'default' as const;
        }

        if (status === 'unresolved') {
            return 'destructive' as const;
        }

        return 'secondary' as const;
    };

    return (
        <>
            <Head title="Incidents" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Incidents"
                    description="Search and review incidents reported in your region."
                />

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
                                                        <Badge
                                                            variant={statusVariant(
                                                                incident.status,
                                                            )}
                                                        >
                                                            {
                                                                incident.status_label
                                                            }
                                                        </Badge>
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
                                                <Badge
                                                    variant={statusVariant(
                                                        incident.status,
                                                    )}
                                                    className="shrink-0"
                                                >
                                                    {incident.status_label}
                                                </Badge>
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
                                        {filters.search
                                            ? 'No incidents found'
                                            : 'No incidents yet'}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {filters.search
                                            ? 'Try a different incident number, title, subcategory, or status.'
                                            : 'Incidents reported in your region will appear here.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
