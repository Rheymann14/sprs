import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CircleAlert,
    CircleCheck,
    Clock3,
    Download,
    FileText,
    Paperclip,
    Send,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    index as incidentsIndex,
    show as showIncident,
    updateStatus,
} from '@/actions/App/Http/Controllers/IncidentController';
import { store as storeMessage } from '@/actions/App/Http/Controllers/IncidentMessageController';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type StatusIcon = 'circle-check' | 'clock' | 'circle-alert';

type Attachment = {
    id?: string;
    name: string;
    url: string;
    mime_type: string;
    size?: number;
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
};

type Conversation = {
    messages: IncidentMessage[];
    has_earlier_messages: boolean;
    message_limit: number;
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
}: {
    attachment: Attachment;
    onOpen: (attachment: Attachment) => void;
}) {
    const isImage = attachment.mime_type.startsWith('image/');

    return (
        <button
            type="button"
            className="group flex max-w-48 min-w-0 items-center gap-2 rounded-lg border bg-background/80 p-2 text-left shadow-xs transition hover:bg-accent"
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
            </span>
        </button>
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
}: {
    incident: Incident;
    conversation: Conversation;
}) {
    const [viewingAttachment, setViewingAttachment] =
        useState<Attachment | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const messageForm = useForm<{ message: string; attachments: File[] }>({
        message: '',
        attachments: [],
    });
    const statusForm = useForm<{ status: string }>({ status: '' });
    const appearance = statusAppearances[incident.status_icon];
    const StatusIcon = appearance.icon;
    const attachmentError = Object.entries(messageForm.errors).find(([key]) =>
        key.startsWith('attachments'),
    )?.[1];

    const chooseAttachments = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        messageForm.setData(
            'attachments',
            [...messageForm.data.attachments, ...selectedFiles].slice(0, 5),
        );
        event.target.value = '';
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

        if (!incident.conversation_open) {
            return;
        }

        messageForm.post(storeMessage.url(incident.id), {
            only: ['conversation'],
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

    return (
        <>
            <Head title={`Incident ${incident.incident_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={incident.incident_number}
                        description={`${incident.incident_type} · ${incident.subcategory}`}
                    />
                    <Button variant="outline" asChild>
                        <Link href={incidentsIndex()}>
                            <ArrowLeft /> Back to incidents
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
                        <CardTitle>Incident conversation</CardTitle>
                        <CardDescription>
                            Messages between CHED Central Office and CHED
                            Regional Office or Agency users.
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
                                    No messages yet. Start the conversation
                                    below.
                                </div>
                            )}
                        </div>

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
                                <div className="flex flex-wrap gap-2">
                                    {messageForm.data.attachments.map(
                                        (attachment, index) => (
                                            <SelectedAttachmentChip
                                                key={`${attachment.name}-${index}`}
                                                attachment={attachment}
                                                onRemove={() =>
                                                    removeAttachment(index)
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            )}
                            {(messageForm.errors.message ||
                                attachmentError) && (
                                <p className="text-sm text-destructive">
                                    {messageForm.errors.message ??
                                        attachmentError}
                                </p>
                            )}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, PDF, or Word · up to 5 files · 5
                                    MB each
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        ref={fileInput}
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        className="hidden"
                                        disabled={!incident.conversation_open}
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
                                            fileInput.current?.click()
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Incident status</CardTitle>
                        <CardDescription>
                            Choose what should happen next. The selected status
                            also controls whether users can continue the
                            conversation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]">
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
                                    ? 'Conversation is open. Users can reply and attach files.'
                                    : 'Conversation is closed. Replies and attachments are disabled.'}
                            </p>
                        </div>

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
                                                disabled={statusForm.processing}
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
                    </CardContent>
                </Card>
            </div>

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
