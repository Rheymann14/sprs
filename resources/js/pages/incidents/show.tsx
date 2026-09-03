import { Deferred, Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    Clock3,
    Download,
    FileText,
    LoaderCircle,
    Paperclip,
    Pencil,
    Plus,
    Printer,
    Search,
    Send,
    Trash2,
    Waypoints,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    destroy as destroyAttachmentType,
    store as storeAttachmentType,
    update as updateAttachmentType,
} from '@/actions/App/Http/Controllers/AttachmentTypeController';
import {
    index as incidentsIndex,
    printData,
    show as showIncident,
    updateStatus,
} from '@/actions/App/Http/Controllers/IncidentController';
import { store as storeMessage } from '@/actions/App/Http/Controllers/IncidentMessageController';
import { update as updateRouting } from '@/actions/App/Http/Controllers/IncidentRoutingController';
import {
    SearchableCommand,
    SearchableMultiCommand,
} from '@/components/searchable-command';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type StatusIcon = 'circle-check' | 'clock' | 'circle-alert';

type Attachment = {
    id?: string;
    name: string;
    url: string;
    mime_type: string;
    size?: number;
    type_name?: string | null;
};

type ReportField = {
    label: string;
    value: string;
    attachment: Attachment | null;
};

type ReportSection = {
    title: string | null;
    description: string | null;
    fields: ReportField[];
};

type IncidentMessage = {
    id: string;
    message: string | null;
    sender_name: string;
    sender_label: 'CHED CO' | 'CHED RO';
    is_own: boolean;
    created_at: string;
    attachments: Attachment[];
};

type Incident = {
    id: string;
    incident_number: string;
    incident_type: string;
    subcategory: string;
    report_title: string;
    report_description: string | null;
    report_sections: ReportSection[];
    status_label: string;
    status_icon: StatusIcon;
    managed_statuses: Array<{
        name: string;
        icon: StatusIcon;
    }>;
    conversation_open: boolean;
    can_respond: boolean;
    can_manage_status: boolean;
};

type Conversation = {
    messages: IncidentMessage[];
    has_earlier_messages: boolean;
    message_limit: number;
};

type AttachmentGroup = {
    id: string;
    sender_name: string;
    sender_label: 'CHED CO' | 'CHED RO' | 'Agency';
    is_own: boolean;
    created_at: string;
    attachments: Attachment[];
};

type AttachmentTypes = {
    items: Array<{ id: string; name: string }>;
    can_manage: boolean;
};

type Routing = {
    origin_region: string;
    can_manage: boolean;
    routed_regions: Array<{ id: string; name: string }>;
    available_regions: Array<{ id: string; name: string }>;
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

const statusExplanations = {
    'circle-check': 'Closes messaging because the incident is resolved.',
    clock: 'Keeps messaging open for replies and attachments.',
    'circle-alert': 'Closes messaging while the incident remains unresolved.',
} satisfies Record<StatusIcon, string>;

function fileSize(size?: number) {
    if (size === undefined) {
        return null;
    }

    return size >= 1024 * 1024
        ? `${(size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(size / 1024))} KB`;
}

function AttachmentThumbnail({
    attachment,
    onOpen,
    fluid = false,
}: {
    attachment: Attachment;
    onOpen: (attachment: Attachment) => void;
    fluid?: boolean;
}) {
    const isImage = attachment.mime_type.startsWith('image/');

    return (
        <button
            type="button"
            className={`group min-w-0 items-center gap-2 rounded-lg border bg-background/80 p-2 text-left shadow-xs transition hover:bg-accent ${fluid ? 'grid w-44 shrink-0 grid-cols-[2.5rem_minmax(0,1fr)]' : 'flex max-w-48'}`}
            onClick={() => onOpen(attachment)}
        >
            {isImage ? (
                <img
                    src={attachment.url}
                    alt=""
                    className="size-10 shrink-0 rounded-md object-cover"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                />
            ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                </span>
            )}
            <span className="min-w-0">
                <span className="block truncate text-xs font-medium">
                    {attachment.name}
                </span>
                {fileSize(attachment.size) && (
                    <span className="block text-[11px] text-muted-foreground">
                        {fileSize(attachment.size)}
                    </span>
                )}
                {attachment.type_name && (
                    <span className="block truncate text-[11px] text-muted-foreground">
                        {attachment.type_name}
                    </span>
                )}
            </span>
        </button>
    );
}

function AttachmentGallery({
    groups,
    onOpen,
}: {
    groups: AttachmentGroup[];
    onOpen: (attachment: Attachment) => void;
}) {
    const pageSize = 4;
    const [searchQuery, setSearchQuery] = useState('');
    const [requestedPage, setRequestedPage] = useState(1);
    const attachmentRows = groups.flatMap((group) =>
        group.attachments.map((attachment) => ({
            attachment,
            group,
        })),
    );
    const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
    const filteredRows = attachmentRows.filter(({ attachment, group }) => {
        if (normalizedSearchQuery === '') {
            return true;
        }

        const searchableText = [
            group.sender_label,
            group.sender_name,
            attachment.name,
            attachment.type_name ?? 'Uncategorized',
            new Date(group.created_at).toLocaleString(),
        ]
            .join(' ')
            .toLocaleLowerCase();

        return searchableText.includes(normalizedSearchQuery);
    });
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(requestedPage, totalPages);
    const firstVisibleRow = (currentPage - 1) * pageSize;
    const visibleRows = filteredRows.slice(
        firstVisibleRow,
        firstVisibleRow + pageSize,
    );

    if (attachmentRows.length === 0) {
        return (
            <div className="rounded-lg border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">
                No files have been attached to this conversation yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={searchQuery}
                    aria-label="Search conversation files"
                    placeholder="Search files, types, or uploaders"
                    className="pl-9"
                    onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setRequestedPage(1);
                    }}
                />
            </div>

            <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-3xl text-sm">
                    <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <tr>
                            <th className="w-1/5 px-4 py-3 font-medium">
                                Uploaded By
                            </th>
                            <th className="w-2/5 px-4 py-3 font-medium">
                                Document File Name
                            </th>
                            <th className="w-1/5 px-4 py-3 font-medium">
                                File Type
                            </th>
                            <th className="w-1/5 px-4 py-3 font-medium">
                                Date Uploaded
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {visibleRows.map(({ attachment, group }) => (
                            <tr
                                key={`${group.id}-${attachment.id}`}
                                className="transition-colors hover:bg-muted/40"
                            >
                                <td className="px-4 py-3 align-middle">
                                    <p className="font-semibold">
                                        {group.sender_label}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {group.sender_name}
                                        {group.is_own ? ' (You)' : ''}
                                    </p>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <button
                                        type="button"
                                        className="group flex max-w-full items-center gap-3 text-left"
                                        onClick={() => onOpen(attachment)}
                                    >
                                        {attachment.mime_type.startsWith(
                                            'image/',
                                        ) ? (
                                            <img
                                                src={attachment.url}
                                                alt=""
                                                className="size-10 shrink-0 rounded-md object-cover"
                                                loading="lazy"
                                                decoding="async"
                                                fetchPriority="low"
                                            />
                                        ) : (
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                                <FileText className="size-5 text-muted-foreground" />
                                            </span>
                                        )}
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium text-primary underline-offset-4 group-hover:underline">
                                                {attachment.name}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                                {fileSize(attachment.size)}
                                            </span>
                                        </span>
                                    </button>
                                </td>
                                <td className="px-4 py-3 align-middle text-muted-foreground">
                                    {attachment.type_name ?? 'Uncategorized'}
                                </td>
                                <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
                                    <time dateTime={group.created_at}>
                                        {new Date(
                                            group.created_at,
                                        ).toLocaleString()}
                                    </time>
                                </td>
                            </tr>
                        ))}
                        {visibleRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-8 text-center text-muted-foreground"
                                >
                                    No conversation files match your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center sm:text-left">
                    {filteredRows.length > 0
                        ? `Showing ${firstVisibleRow + 1}\u2013${Math.min(firstVisibleRow + pageSize, filteredRows.length)} of ${filteredRows.length}`
                        : 'Showing 0 files'}
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={currentPage === 1}
                        onClick={() =>
                            setRequestedPage((page) => Math.max(1, page - 1))
                        }
                    >
                        <ChevronLeft /> Previous
                    </Button>
                    <span className="px-1 text-center whitespace-nowrap sm:px-2">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                            setRequestedPage((page) =>
                                Math.min(totalPages, page + 1),
                            )
                        }
                    >
                        Next <ChevronRight />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function AttachmentGallerySkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-9 max-w-sm rounded-md bg-muted/50" />
            <div className="overflow-hidden rounded-xl border">
                <div className="h-10 border-b bg-muted/50" />
                {Array.from({ length: 4 }, (_, index) => (
                    <div
                        key={index}
                        className="h-16 border-b bg-muted/20 last:border-b-0"
                    />
                ))}
            </div>
        </div>
    );
}

function SelectedAttachmentChip({
    attachment,
    onRemove,
}: {
    attachment: File;
    onRemove: () => void;
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const isImage = attachment.type.startsWith('image/');

    useEffect(() => {
        if (!attachment.type.startsWith('image/')) {
            return;
        }

        let cancelled = false;

        const createThumbnail = async () => {
            const image = await createImageBitmap(attachment);
            const longestSide = Math.max(image.width, image.height);
            const scale = Math.min(1, 64 / longestSide);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            const context = canvas.getContext('2d');

            context?.drawImage(image, 0, 0, canvas.width, canvas.height);
            image.close();

            if (!cancelled && context) {
                setPreviewUrl(canvas.toDataURL('image/webp', 0.72));
            }
        };

        void createThumbnail().catch(() => {
            if (!cancelled) {
                setPreviewUrl(null);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [attachment]);

    return (
        <div className="flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border bg-background px-1.5 py-1 shadow-xs sm:w-52">
            {isImage && previewUrl ? (
                <img
                    src={previewUrl}
                    alt=""
                    className="size-8 shrink-0 rounded object-cover"
                />
            ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
                    <FileText className="size-4 text-muted-foreground" />
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                    {attachment.name}
                </span>
                <span className="block text-[10px] leading-3 text-muted-foreground">
                    {fileSize(attachment.size)}
                </span>
            </span>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6 shrink-0"
                aria-label={`Remove ${attachment.name}`}
                onClick={onRemove}
            >
                <X className="size-3.5" />
            </Button>
        </div>
    );
}

export default function IncidentShow({
    incident,
    conversation,
    routing,
    attachment_groups,
    attachment_types,
}: {
    incident: Incident;
    conversation: Conversation;
    routing: Routing;
    attachment_groups?: AttachmentGroup[];
    attachment_types: AttachmentTypes;
}) {
    const [viewingAttachment, setViewingAttachment] =
        useState<Attachment | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
    const [attachmentTypeEditor, setAttachmentTypeEditor] = useState<
        'create' | 'edit' | null
    >(null);
    const [isPreparingPdf, setIsPreparingPdf] = useState(false);
    const messageForm = useForm<{
        message: string;
        attachment_type_id: string;
        attachments: File[];
    }>({
        message: '',
        attachment_type_id: '',
        attachments: [],
    });
    const createAttachmentTypeForm = useForm({ name: '' });
    const editAttachmentTypeForm = useForm({ name: '' });
    const deleteAttachmentTypeForm = useForm({});
    const statusForm = useForm<{ status: string }>({ status: '' });
    const routingForm = useForm<{ region_ids: string[] }>({
        region_ids: routing.routed_regions.map((region) => region.id),
    });
    const appearance = statusAppearances[incident.status_icon];
    const StatusIcon = appearance.icon;
    const attachmentError = Object.entries(messageForm.errors).find(([key]) =>
        key.startsWith('attachments'),
    )?.[1];
    const selectedAttachmentType = attachment_types.items.find(
        (attachmentType) =>
            attachmentType.id === messageForm.data.attachment_type_id,
    );

    const chooseAttachments = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        messageForm.setData(
            'attachments',
            [...messageForm.data.attachments, ...selectedFiles].slice(0, 5),
        );

        if (selectedFiles.length > 0) {
            setAttachmentDialogOpen(false);
        }

        event.target.value = '';
    };

    const createAttachmentType = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createAttachmentTypeForm.post(storeAttachmentType.url(), {
            only: ['attachment_types'],
            preserveScroll: true,
            onSuccess: () => {
                createAttachmentTypeForm.reset();
                setAttachmentTypeEditor(null);
            },
        });
    };

    const editAttachmentType = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedAttachmentType) {
            return;
        }

        editAttachmentTypeForm.put(
            updateAttachmentType.url(selectedAttachmentType.id),
            {
                only: ['attachment_types'],
                preserveScroll: true,
                onSuccess: () => setAttachmentTypeEditor(null),
            },
        );
    };

    const deleteSelectedAttachmentType = () => {
        if (
            !selectedAttachmentType ||
            !window.confirm(
                `Delete the “${selectedAttachmentType.name}” attachment type? Existing files will be kept.`,
            )
        ) {
            return;
        }

        deleteAttachmentTypeForm.delete(
            destroyAttachmentType.url(selectedAttachmentType.id),
            {
                only: ['attachment_types'],
                preserveScroll: true,
                onSuccess: () => {
                    messageForm.setData('attachment_type_id', '');
                    setAttachmentTypeEditor(null);
                },
            },
        );
    };

    const removeAttachment = (index: number) => {
        messageForm.setData(
            'attachments',
            messageForm.data.attachments.filter(
                (_attachment, attachmentIndex) => attachmentIndex !== index,
            ),
        );
    };

    const sendMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!incident.conversation_open || !incident.can_respond) {
            return;
        }

        messageForm.post(storeMessage.url(incident.id), {
            only: ['conversation', 'attachment_groups'],
            preserveScroll: true,
            onSuccess: () => messageForm.reset(),
        });
    };

    const changeStatus = (status: { name: string; icon: StatusIcon }) => {
        statusForm.transform(() => ({ status: status.name }));
        statusForm.patch(updateStatus.url(incident.id), {
            only: ['incident', 'conversation'],
            preserveScroll: true,
            onSuccess: () => {
                if (status.icon !== 'clock') {
                    messageForm.reset();
                }
            },
        });
    };

    const saveRouting = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        routingForm.put(updateRouting.url(incident.id), {
            only: ['routing'],
            preserveScroll: true,
        });
    };

    const printIncident = async () => {
        const printWindow = window.open('', '_blank');

        if (printWindow) {
            printWindow.document.title = `Preparing ${incident.incident_number}`;
            printWindow.document.body.textContent = 'Preparing incident PDF…';
        }

        setIsPreparingPdf(true);

        try {
            const response = await fetch(printData.url(incident.id), {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Unable to load the complete conversation.');
            }

            const printConversation = (await response.json()) as {
                messages: IncidentMessage[];
            };
            const [{ pdf }, { IncidentPdfDocument }] = await Promise.all([
                import('@react-pdf/renderer'),
                import('@/components/incident-pdf-document'),
            ]);
            const blob = await pdf(
                <IncidentPdfDocument
                    incident={incident}
                    messages={printConversation.messages}
                    routing={routing}
                    generatedAt={new Date().toISOString()}
                />,
            ).toBlob();
            const pdfUrl = URL.createObjectURL(blob);

            if (printWindow) {
                printWindow.location.href = pdfUrl;
            } else {
                const downloadLink = document.createElement('a');
                downloadLink.href = pdfUrl;
                downloadLink.download = `${incident.incident_number}.pdf`;
                downloadLink.click();
            }

            window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 300_000);
        } catch {
            printWindow?.close();
            toast.error(
                'The incident PDF could not be prepared. Please try again.',
            );
        } finally {
            setIsPreparingPdf(false);
        }
    };

    return (
        <>
            <Head title={`Incident ${incident.incident_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <header className="mb-8 space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-xl font-semibold tracking-tight">
                                {incident.incident_number}
                            </h1>
                            <Badge
                                variant="outline"
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold [&>svg]:size-4 ${appearance.className}`}
                            >
                                <StatusIcon /> {incident.status_label}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {incident.incident_type} · {incident.subcategory}
                        </p>
                    </header>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPreparingPdf}
                            onClick={() => void printIncident()}
                        >
                            {isPreparingPdf ? (
                                <LoaderCircle className="animate-spin" />
                            ) : (
                                <Printer />
                            )}
                            {isPreparingPdf ? 'Preparing PDF…' : 'Print PDF'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={incidentsIndex()}>
                                <ArrowLeft /> Back to incidents
                            </Link>
                        </Button>
                    </div>
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
                                                            <AttachmentThumbnail
                                                                attachment={
                                                                    field.attachment
                                                                }
                                                                onOpen={
                                                                    setViewingAttachment
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </dl>
                                    </section>
                                ),
                            )
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No saved report details.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Waypoints className="size-5" /> Incident routing
                        </CardTitle>
                        <CardDescription>
                            Routing shares this incident with another CHED
                            office. Authorized administrators and staff there
                            can participate in its conversation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                            <Building2 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Originating office
                                </p>
                                <p className="font-medium">
                                    {routing.origin_region}
                                </p>
                            </div>
                        </div>

                        {routing.can_manage ? (
                            <form className="space-y-3" onSubmit={saveRouting}>
                                <div>
                                    <p className="text-sm font-medium">
                                        Share with CHED offices
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Selected offices can view the report.
                                        Their CHED administrators and staff can
                                        reply while the conversation is open.
                                    </p>
                                </div>
                                <SearchableMultiCommand
                                    value={routingForm.data.region_ids}
                                    options={routing.available_regions.map(
                                        (region) => ({
                                            value: region.id,
                                            label: region.name,
                                        }),
                                    )}
                                    placeholder="Select CHED offices"
                                    searchPlaceholder="Search CHED offices..."
                                    emptyMessage="No CHED offices found."
                                    selectedLabel="offices selected"
                                    disabled={routingForm.processing}
                                    onValueChange={(regionIds) =>
                                        routingForm.setData(
                                            'region_ids',
                                            regionIds,
                                        )
                                    }
                                />
                                {routingForm.errors.region_ids && (
                                    <p className="text-sm text-destructive">
                                        {routingForm.errors.region_ids}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Removing an office revokes its access to
                                    this incident.
                                </p>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={
                                            routingForm.processing ||
                                            !routingForm.isDirty
                                        }
                                    >
                                        <Waypoints />
                                        {routingForm.processing
                                            ? 'Saving…'
                                            : 'Save routing'}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <p className="text-sm font-medium">Routed to</p>
                                {routing.routed_regions.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {routing.routed_regions.map(
                                            (region) => (
                                                <Badge
                                                    key={region.id}
                                                    variant="secondary"
                                                >
                                                    {region.name}
                                                </Badge>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        No additional offices yet.
                                    </p>
                                )}
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Only a CHED administrator from the
                                    originating office can change routing.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Incident conversation</CardTitle>
                        <CardDescription>
                            Messages between authorized CHED Central Office and
                            Regional Office administrators and staff.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-h-[32rem] min-h-56 space-y-4 overflow-y-auto rounded-xl border bg-muted/20 p-3 sm:p-5">
                            {conversation.has_earlier_messages && (
                                <div className="flex justify-center">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link
                                            href={showIncident(incident.id, {
                                                query: {
                                                    messages: Math.min(
                                                        conversation.message_limit +
                                                            30,
                                                        150,
                                                    ),
                                                },
                                            })}
                                            only={['conversation']}
                                            preserveScroll
                                            preserveState
                                        >
                                            Load earlier messages
                                        </Link>
                                    </Button>
                                </div>
                            )}
                            {conversation.messages.length > 0 ? (
                                conversation.messages.map((message) => (
                                    <article
                                        key={message.id}
                                        className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className="max-w-[90%] space-y-1 sm:max-w-[75%]">
                                            <div
                                                className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${message.is_own ? 'justify-end' : ''}`}
                                            >
                                                <span className="font-semibold">
                                                    {message.sender_label}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {message.sender_name}
                                                </span>
                                                <time className="text-muted-foreground">
                                                    {new Date(
                                                        message.created_at,
                                                    ).toLocaleString()}
                                                </time>
                                            </div>
                                            <div
                                                className={`rounded-2xl px-3.5 py-3 shadow-xs ${
                                                    message.is_own
                                                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                                                        : 'rounded-bl-sm border bg-background'
                                                }`}
                                            >
                                                {message.message && (
                                                    <p className="text-sm break-words whitespace-pre-wrap">
                                                        {message.message}
                                                    </p>
                                                )}
                                                {message.attachments.length >
                                                    0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {message.attachments.map(
                                                            (attachment) => (
                                                                <AttachmentThumbnail
                                                                    key={
                                                                        attachment.id
                                                                    }
                                                                    attachment={
                                                                        attachment
                                                                    }
                                                                    onOpen={
                                                                        setViewingAttachment
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
                                    {incident.can_respond
                                        ? 'No messages yet. Start the conversation below.'
                                        : 'No messages yet.'}
                                </div>
                            )}
                        </div>

                        {incident.can_respond ? (
                            <form className="space-y-3" onSubmit={sendMessage}>
                                {!incident.conversation_open && (
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
                                        This conversation is closed. Mark the
                                        incident as a pending status to reply or
                                        attach files.
                                    </div>
                                )}
                                <Textarea
                                    value={messageForm.data.message}
                                    placeholder={
                                        incident.conversation_open
                                            ? 'Write a message…'
                                            : 'Conversation closed'
                                    }
                                    aria-label="Incident message"
                                    rows={3}
                                    disabled={!incident.conversation_open}
                                    onChange={(event) =>
                                        messageForm.setData(
                                            'message',
                                            event.target.value,
                                        )
                                    }
                                />
                                {messageForm.data.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        {selectedAttachmentType && (
                                            <p className="text-xs text-muted-foreground">
                                                Attachment type:{' '}
                                                <span className="font-medium text-foreground">
                                                    {
                                                        selectedAttachmentType.name
                                                    }
                                                </span>
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {messageForm.data.attachments.map(
                                                (attachment, index) => (
                                                    <SelectedAttachmentChip
                                                        key={`${attachment.name}-${index}`}
                                                        attachment={attachment}
                                                        onRemove={() =>
                                                            removeAttachment(
                                                                index,
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                                {(messageForm.errors.message ||
                                    messageForm.errors.attachment_type_id ||
                                    attachmentError) && (
                                    <p className="text-sm text-destructive">
                                        {messageForm.errors.message ??
                                            messageForm.errors
                                                .attachment_type_id ??
                                            attachmentError}
                                    </p>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG, PDF, or Word · up to 5 files ·
                                        5 MB each
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            ref={fileInput}
                                            type="file"
                                            multiple
                                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                            className="hidden"
                                            disabled={
                                                !incident.conversation_open
                                            }
                                            onChange={chooseAttachments}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={
                                                !incident.conversation_open ||
                                                messageForm.data.attachments
                                                    .length >= 5
                                            }
                                            onClick={() =>
                                                setAttachmentDialogOpen(true)
                                            }
                                        >
                                            <Paperclip /> Attach
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                !incident.conversation_open ||
                                                messageForm.processing
                                            }
                                        >
                                            <Send />
                                            {messageForm.processing
                                                ? 'Sending…'
                                                : 'Send'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                                <p className="font-medium">
                                    View-only conversation
                                </p>
                                <p className="mt-1 text-muted-foreground">
                                    Only CHEDCO/CHEDRO Administrators and Staff
                                    can reply. You can still read the
                                    conversation.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Incident status</CardTitle>
                        <CardDescription>
                            CO and RO administrators manage the status here. The
                            selected status also controls whether users can
                            continue the conversation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent
                        className={`grid gap-6 ${incident.can_manage_status ? 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]' : ''}`}
                    >
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Current status
                            </p>
                            <Badge
                                variant="outline"
                                className={`mt-2 w-fit px-3 py-1.5 ${appearance.className}`}
                            >
                                <StatusIcon /> {incident.status_label}
                            </Badge>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {incident.conversation_open
                                    ? 'Conversation is open. Authorized CHED administrators and staff can reply and attach files.'
                                    : 'Conversation is closed. Replies and attachments are disabled.'}
                            </p>
                        </div>

                        {incident.can_manage_status ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium">
                                        Change status
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Select an option below to update the
                                        incident.
                                    </p>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {incident.managed_statuses
                                        .filter(
                                            (status) =>
                                                status.name !==
                                                incident.status_label,
                                        )
                                        .map((status) => {
                                            const statusAppearance =
                                                statusAppearances[status.icon];
                                            const ManagedStatusIcon =
                                                statusAppearance.icon;

                                            return (
                                                <Button
                                                    key={`${status.icon}-${status.name}`}
                                                    type="button"
                                                    variant="outline"
                                                    className={`h-auto min-h-20 justify-start gap-3 p-3 text-left whitespace-normal ${statusAppearance.className}`}
                                                    disabled={
                                                        statusForm.processing
                                                    }
                                                    onClick={() =>
                                                        changeStatus(status)
                                                    }
                                                >
                                                    <ManagedStatusIcon className="size-5 shrink-0" />
                                                    <span className="min-w-0">
                                                        <span className="font-semibold">
                                                            {status.name}
                                                        </span>
                                                        <span className="mt-1 block text-xs font-normal opacity-80">
                                                            {
                                                                statusExplanations[
                                                                    status.icon
                                                                ]
                                                            }
                                                        </span>
                                                    </span>
                                                </Button>
                                            );
                                        })}
                                </div>
                                {statusForm.errors.status && (
                                    <p className="text-sm text-destructive">
                                        {statusForm.errors.status}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Only Central Office and Regional Office
                                administrators can change this status.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="gap-3 py-4">
                    <CardHeader className="gap-1 px-4 sm:px-5">
                        <CardTitle className="text-sm">
                            Conversation files
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Search and preview all files shared in this
                            incident.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-5">
                        <Deferred
                            data="attachment_groups"
                            fallback={<AttachmentGallerySkeleton />}
                        >
                            <AttachmentGallery
                                groups={attachment_groups ?? []}
                                onOpen={setViewingAttachment}
                            />
                        </Deferred>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={attachmentDialogOpen}
                onOpenChange={(open) => {
                    setAttachmentDialogOpen(open);

                    if (!open) {
                        setAttachmentTypeEditor(null);
                        createAttachmentTypeForm.clearErrors();
                        editAttachmentTypeForm.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Attach files</DialogTitle>
                        <DialogDescription>
                            Select an attachment type for your region, then
                            browse for one or more files.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="attachment-type">
                                Attachment type
                            </Label>
                            <div className="flex items-start gap-2">
                                <div
                                    id="attachment-type"
                                    className="min-w-0 flex-1"
                                >
                                    <SearchableCommand
                                        value={
                                            messageForm.data.attachment_type_id
                                        }
                                        options={attachment_types.items.map(
                                            (attachmentType) => ({
                                                value: attachmentType.id,
                                                label: attachmentType.name,
                                            }),
                                        )}
                                        placeholder="Select attachment type"
                                        searchPlaceholder="Search attachment types..."
                                        emptyMessage="No attachment types in your region."
                                        onValueChange={(value) => {
                                            messageForm.setData(
                                                'attachment_type_id',
                                                value,
                                            );
                                            setAttachmentTypeEditor(null);
                                        }}
                                    />
                                </div>
                                {attachment_types.can_manage && (
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            aria-label="Add attachment type"
                                            onClick={() => {
                                                createAttachmentTypeForm.reset();
                                                setAttachmentTypeEditor(
                                                    'create',
                                                );
                                            }}
                                        >
                                            <Plus />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            aria-label="Edit selected attachment type"
                                            disabled={!selectedAttachmentType}
                                            onClick={() => {
                                                if (selectedAttachmentType) {
                                                    editAttachmentTypeForm.setData(
                                                        'name',
                                                        selectedAttachmentType.name,
                                                    );
                                                    setAttachmentTypeEditor(
                                                        'edit',
                                                    );
                                                }
                                            }}
                                        >
                                            <Pencil />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            aria-label="Delete selected attachment type"
                                            disabled={
                                                !selectedAttachmentType ||
                                                deleteAttachmentTypeForm.processing
                                            }
                                            onClick={
                                                deleteSelectedAttachmentType
                                            }
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {attachmentTypeEditor && (
                            <form
                                className="space-y-3 rounded-lg border bg-muted/30 p-3"
                                onSubmit={
                                    attachmentTypeEditor === 'create'
                                        ? createAttachmentType
                                        : editAttachmentType
                                }
                            >
                                <Label htmlFor="attachment-type-name">
                                    {attachmentTypeEditor === 'create'
                                        ? 'New attachment type'
                                        : 'Rename attachment type'}
                                </Label>
                                <Input
                                    id="attachment-type-name"
                                    autoFocus
                                    value={
                                        attachmentTypeEditor === 'create'
                                            ? createAttachmentTypeForm.data.name
                                            : editAttachmentTypeForm.data.name
                                    }
                                    placeholder="e.g. Investigation report"
                                    onChange={(event) =>
                                        attachmentTypeEditor === 'create'
                                            ? createAttachmentTypeForm.setData(
                                                  'name',
                                                  event.target.value,
                                              )
                                            : editAttachmentTypeForm.setData(
                                                  'name',
                                                  event.target.value,
                                              )
                                    }
                                />
                                {(attachmentTypeEditor === 'create'
                                    ? createAttachmentTypeForm.errors.name
                                    : editAttachmentTypeForm.errors.name) && (
                                    <p className="text-sm text-destructive">
                                        {attachmentTypeEditor === 'create'
                                            ? createAttachmentTypeForm.errors
                                                  .name
                                            : editAttachmentTypeForm.errors
                                                  .name}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            setAttachmentTypeEditor(null)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            attachmentTypeEditor === 'create'
                                                ? createAttachmentTypeForm.processing
                                                : editAttachmentTypeForm.processing
                                        }
                                    >
                                        Save
                                    </Button>
                                </div>
                            </form>
                        )}

                        {messageForm.errors.attachment_type_id && (
                            <p className="text-sm text-destructive">
                                {messageForm.errors.attachment_type_id}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            disabled={!selectedAttachmentType}
                            onClick={() => fileInput.current?.click()}
                        >
                            <Paperclip /> Browse files
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            Attachment preview
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
                                        This document opens in your browser or
                                        its associated application.
                                    </p>
                                    <Button asChild>
                                        <a
                                            href={viewingAttachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Download /> Open attachment
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
