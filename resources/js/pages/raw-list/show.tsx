import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Download,
    FileText,
    MapPin,
} from 'lucide-react';
import { index as rawListIndex } from '@/actions/App/Http/Controllers/RawIncidentController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type ReportField = {
    label: string;
    value: string;
    attachment: { name: string; url: string } | null;
};

type ReportSection = {
    title: string | null;
    description: string | null;
    fields: ReportField[];
};

type Incident = {
    id: string;
    incident_number: string;
    incident_type: string;
    subcategory: string;
    region: string;
    status: string;
    created_at: string;
    report_title: string;
    report_description: string | null;
    report_sections: ReportSection[];
};

export default function RawIncidentDetails({
    incident,
}: {
    incident: Incident;
}) {
    return (
        <>
            <Head title={`Raw List - ${incident.incident_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <header className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-mono text-xl font-semibold tracking-tight">
                                {incident.incident_number}
                            </h1>
                            <Badge variant="outline">{incident.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {incident.incident_type} · {incident.subcategory}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="size-4" />
                                {new Date(incident.created_at).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="size-4" /> {incident.region}
                            </span>
                        </div>
                    </header>
                    <Button variant="outline" asChild>
                        <Link href={rawListIndex()}>
                            <ArrowLeft /> Back to raw list
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{incident.report_title}</CardTitle>
                        {incident.report_description && (
                            <CardDescription>
                                {incident.report_description}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {incident.report_sections.length > 0 ? (
                            incident.report_sections.map(
                                (section, sectionIndex) => (
                                    <section
                                        key={`${section.title ?? 'section'}-${sectionIndex}`}
                                        className="space-y-4"
                                    >
                                        {(section.title ||
                                            section.description) && (
                                            <div className="space-y-1 border-b pb-3">
                                                {section.title && (
                                                    <h2 className="font-semibold">
                                                        {section.title}
                                                    </h2>
                                                )}
                                                {section.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {section.description}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                            {section.fields.map(
                                                (field, fieldIndex) => (
                                                    <div
                                                        key={`${field.label}-${fieldIndex}`}
                                                        className="min-w-0 space-y-1"
                                                    >
                                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                            {field.label}
                                                        </dt>
                                                        <dd className="break-words whitespace-pre-wrap">
                                                            {field.value}
                                                        </dd>
                                                        {field.attachment && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <a
                                                                    href={
                                                                        field
                                                                            .attachment
                                                                            .url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <Download />
                                                                    {
                                                                        field
                                                                            .attachment
                                                                            .name
                                                                    }
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </dl>
                                    </section>
                                ),
                            )
                        ) : (
                            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
                                <FileText className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        No saved form answers
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        This incident does not have a report
                                        snapshot.
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
