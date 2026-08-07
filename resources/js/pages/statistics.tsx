import { Head } from '@inertiajs/react';
import {
    CircleAlert,
    CircleCheckBig,
    ClipboardList,
    Clock3,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Card, CardContent } from '@/components/ui/card';
import { statistics } from '@/routes';

type StatisticsProps = {
    statistics: {
        total: number;
        resolved: number;
        pending: number;
        unresolved: number;
    };
};

export default function Statistics({ statistics: counts }: StatisticsProps) {
    const summaryCards = [
        {
            title: 'Total Incident Count',
            value: counts.total,
            icon: ClipboardList,
            iconClassName:
                'bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
        },
        {
            title: 'Resolved Count',
            value: counts.resolved,
            icon: CircleCheckBig,
            iconClassName:
                'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
        },
        {
            title: 'Pending Count',
            value: counts.pending,
            icon: Clock3,
            iconClassName:
                'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
        },
        {
            title: 'Unresolved Count',
            value: counts.unresolved,
            icon: CircleAlert,
            iconClassName:
                'bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
        },
    ];

    return (
        <>
            <Head title="Statistics" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Statistics"
                    description="A quick overview of reported incident statuses."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <Card
                            key={card.title}
                            className="gap-0 overflow-hidden py-0 shadow-xs"
                        >
                            <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
                                <div className="min-w-0 space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {card.title}
                                    </p>
                                    <p className="text-3xl font-semibold tracking-tight tabular-nums">
                                        {card.value.toLocaleString()}
                                    </p>
                                </div>
                                <div
                                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.iconClassName}`}
                                >
                                    <card.icon
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
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
