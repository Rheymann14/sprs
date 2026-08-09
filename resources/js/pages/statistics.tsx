import { Head, Link, router } from '@inertiajs/react';
import {
    CircleAlert,
    CircleCheck,
    ClipboardList,
    Clock3,
    Eye,
    Siren,
} from 'lucide-react';
import { index as incidentsIndex } from '@/actions/App/Http/Controllers/IncidentController';
import Heading from '@/components/heading';
import { SearchableCommand } from '@/components/searchable-command';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { statistics } from '@/routes';

type StatusIcon = 'circle-check' | 'clock' | 'circle-alert';

type StatusCount = {
    name: string;
    icon: StatusIcon;
    count: number;
};

type StatisticsRow = {
    year: number;
    incident_type_id: string;
    incident_type: string;
    subcategory_id: string;
    subcategory: string;
    total: number;
    status_counts: StatusCount[];
};

type StatisticsProps = {
    statistics: {
        total: number;
        status_counts: StatusCount[];
        rows: StatisticsRow[];
    };
    filters: {
        region_id: string;
    };
    regions: Array<{ id: string; name: string }>;
};

const statusAppearances = {
    'circle-check': {
        icon: CircleCheck,
        iconClassName:
            'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    },
    clock: {
        icon: Clock3,
        iconClassName:
            'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    },
    'circle-alert': {
        icon: CircleAlert,
        iconClassName:
            'bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
    },
} satisfies Record<
    StatusIcon,
    { icon: typeof CircleCheck; iconClassName: string }
>;

type CountCardProps = {
    title: string;
    value: number;
    icon: typeof CircleCheck;
    iconClassName: string;
    href: string;
};

function CountCard({
    title,
    value,
    icon: Icon,
    iconClassName,
    href,
}: CountCardProps) {
    return (
        <Link
            href={href}
            aria-label={`View ${title.toLowerCase()} in incidents`}
            className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
            <Card className="h-full gap-0 overflow-hidden py-0 shadow-xs transition-colors hover:border-primary/40 hover:bg-muted/30">
                <CardContent className="flex min-h-28 items-center justify-between gap-4 p-5 sm:p-6">
                    <div className="min-w-0 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="text-3xl font-semibold tracking-tight tabular-nums">
                            {value.toLocaleString()}
                        </p>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                            <Eye aria-hidden="true" className="size-3.5" />
                            View incidents
                        </span>
                    </div>
                    <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
                    >
                        <Icon aria-hidden="true" className="size-5" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function Statistics({
    statistics: counts,
    filters,
    regions,
}: StatisticsProps) {
    const filterByRegion = (regionId: string) => {
        router.get(
            statistics.url({
                query: {
                    region_id: regionId === 'all' ? undefined : regionId,
                },
            }),
            {},
            {
                only: ['statistics', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Statistics" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Statistics"
                        description="Incident totals and managed status counts for the regions you can access."
                    />
                    {regions.length > 0 && (
                        <div className="w-full sm:w-64">
                            <SearchableCommand
                                value={filters.region_id || 'all'}
                                options={[
                                    { value: 'all', label: 'All regions' },
                                    ...regions.map((region) => ({
                                        value: region.id,
                                        label: region.name,
                                    })),
                                ]}
                                placeholder="Filter by region"
                                searchPlaceholder="Search regions..."
                                emptyMessage="No regions found."
                                onValueChange={filterByRegion}
                            />
                        </div>
                    )}
                </div>

                {counts.rows.length > 0 ? (
                    <div className="flex flex-col gap-8">
                        {counts.rows.map((row) => {
                            const rowCards = [
                                {
                                    title: 'Total Incident Count',
                                    value: row.total,
                                    icon: ClipboardList,
                                    iconClassName:
                                        'bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
                                    href: incidentsIndex.url({
                                        query: {
                                            year: row.year,
                                            incident_type_id:
                                                row.incident_type_id,
                                            subcategory_id: row.subcategory_id,
                                            region_id:
                                                filters.region_id || undefined,
                                        },
                                    }),
                                },
                                ...row.status_counts.map((status) => ({
                                    title: `${status.name} Count`,
                                    value: status.count,
                                    icon: statusAppearances[status.icon].icon,
                                    iconClassName:
                                        statusAppearances[status.icon]
                                            .iconClassName,
                                    href: incidentsIndex.url({
                                        query: {
                                            year: row.year,
                                            incident_type_id:
                                                row.incident_type_id,
                                            subcategory_id: row.subcategory_id,
                                            status: status.name,
                                            region_id:
                                                filters.region_id || undefined,
                                        },
                                    }),
                                })),
                            ];

                            return (
                                <section
                                    key={`${row.year}-${row.incident_type}-${row.subcategory}`}
                                    className="space-y-4"
                                >
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Year
                                            </span>
                                            <Badge variant="secondary">
                                                {row.year}
                                            </Badge>
                                        </div>
                                        <div className="flex min-w-0 items-baseline gap-2">
                                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Incident
                                            </span>
                                            <span className="truncate font-semibold">
                                                {row.incident_type}
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 items-baseline gap-2">
                                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Subcategory
                                            </span>
                                            <span className="truncate font-semibold">
                                                {row.subcategory}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {rowCards.map((card) => (
                                            <CountCard
                                                key={card.title}
                                                {...card}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
                        <div className="rounded-full bg-muted p-3">
                            <Siren className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">
                                No incident reports yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Saved reports for the selected region will
                                appear here.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Statistics.layout = {
    breadcrumbs: [
        {
            title: 'Statistics',
            href: statistics(),
        },
    ],
};
