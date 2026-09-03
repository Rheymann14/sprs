import {
    Document,
    Link,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';

type Attachment = {
    name: string;
    url: string;
    mime_type: string;
    size?: number;
    type_name?: string | null;
};

type ReportSection = {
    title: string | null;
    description: string | null;
    fields: Array<{
        label: string;
        value: string;
        attachment: Attachment | null;
    }>;
};

type Incident = {
    incident_number: string;
    incident_type: string;
    subcategory: string;
    report_title: string;
    report_description: string | null;
    report_sections: ReportSection[];
    status_label: string;
};

type IncidentMessage = {
    id: string;
    message: string | null;
    sender_name: string;
    sender_label: string;
    created_at: string;
    attachments: Attachment[];
};

type Routing = {
    origin_region: string;
    routed_regions: Array<{ id: string; name: string }>;
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 44,
        paddingRight: 42,
        paddingBottom: 52,
        paddingLeft: 42,
        color: '#172033',
        fontFamily: 'Helvetica',
        fontSize: 9,
        lineHeight: 1.45,
    },
    header: {
        marginBottom: 18,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
    },
    eyebrow: {
        marginBottom: 4,
        color: '#64748b',
        fontSize: 8,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    title: {
        marginBottom: 4,
        color: '#0f172a',
        fontSize: 17,
        fontFamily: 'Helvetica-Bold',
    },
    subtitle: {
        color: '#475569',
        fontSize: 9,
    },
    summary: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 18,
    },
    summaryItem: {
        width: '48%',
        padding: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
    },
    label: {
        marginBottom: 2,
        color: '#64748b',
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
    },
    value: {
        color: '#172033',
        fontSize: 9,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeading: {
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        color: '#0f172a',
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
    },
    sectionDescription: {
        marginBottom: 8,
        color: '#64748b',
        fontSize: 8,
    },
    field: {
        marginBottom: 8,
    },
    link: {
        marginTop: 2,
        color: '#1d4ed8',
        fontSize: 8,
        textDecoration: 'underline',
    },
    message: {
        marginBottom: 9,
        padding: 9,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        backgroundColor: '#f8fafc',
    },
    messageMeta: {
        marginBottom: 4,
        color: '#475569',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    messageBody: {
        color: '#172033',
        fontSize: 9,
    },
    attachmentList: {
        marginTop: 6,
        gap: 3,
    },
    fileRow: {
        marginBottom: 7,
        paddingBottom: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    empty: {
        color: '#64748b',
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        right: 42,
        bottom: 24,
        left: 42,
        flexDirection: 'row',
        justifyContent: 'space-between',
        color: '#94a3b8',
        fontSize: 7,
    },
});

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
    }).format(new Date(value));
}

function formatFileSize(size?: number): string | null {
    if (size === undefined) {
        return null;
    }

    return size >= 1024 * 1024
        ? `${(size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(size / 1024))} KB`;
}

function absoluteUrl(url: string): string {
    return new URL(url, window.location.origin).href;
}

function AttachmentLink({ attachment }: { attachment: Attachment }) {
    const metadata = [
        attachment.type_name ?? 'Uncategorized',
        formatFileSize(attachment.size),
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <Link src={absoluteUrl(attachment.url)} style={styles.link}>
            {attachment.name} ({metadata})
        </Link>
    );
}

export function IncidentPdfDocument({
    incident,
    messages,
    routing,
    generatedAt,
}: {
    incident: Incident;
    messages: IncidentMessage[];
    routing: Routing;
    generatedAt: string;
}) {
    const conversationFiles = messages.flatMap((message) =>
        message.attachments.map((attachment) => ({ attachment, message })),
    );

    return (
        <Document
            title={`Incident ${incident.incident_number}`}
            subject="Incident details, conversation, and conversation files"
            creator="SPRS"
        >
            <Page size="A4" style={styles.page} wrap>
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>Incident report</Text>
                    <Text style={styles.title}>{incident.incident_number}</Text>
                    <Text style={styles.subtitle}>
                        {incident.incident_type} · {incident.subcategory}
                    </Text>
                </View>

                <View style={styles.summary}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={styles.value}>
                            {incident.status_label}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.label}>Generated</Text>
                        <Text style={styles.value}>
                            {formatDate(generatedAt)}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.label}>Originating office</Text>
                        <Text style={styles.value}>
                            {routing.origin_region}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.label}>Shared with</Text>
                        <Text style={styles.value}>
                            {routing.routed_regions.length > 0
                                ? routing.routed_regions
                                      .map((region) => region.name)
                                      .join(', ')
                                : 'No other offices'}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>
                        {incident.report_title}
                    </Text>
                    {incident.report_description && (
                        <Text style={styles.sectionDescription}>
                            {incident.report_description}
                        </Text>
                    )}
                    {incident.report_sections.map((section, sectionIndex) => (
                        <View
                            key={`${section.title ?? 'section'}-${sectionIndex}`}
                        >
                            {section.title && (
                                <Text style={styles.sectionHeading}>
                                    {section.title}
                                </Text>
                            )}
                            {section.description && (
                                <Text style={styles.sectionDescription}>
                                    {section.description}
                                </Text>
                            )}
                            {section.fields.map((field, fieldIndex) => (
                                <View
                                    key={`${field.label}-${fieldIndex}`}
                                    style={styles.field}
                                >
                                    <Text style={styles.label}>
                                        {field.label}
                                    </Text>
                                    <Text style={styles.value}>
                                        {field.value || '—'}
                                    </Text>
                                    {field.attachment && (
                                        <AttachmentLink
                                            attachment={field.attachment}
                                        />
                                    )}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>
                        Incident conversation
                    </Text>
                    {messages.length === 0 ? (
                        <Text style={styles.empty}>
                            No conversation messages.
                        </Text>
                    ) : (
                        messages.map((message) => (
                            <View key={message.id} style={styles.message}>
                                <Text style={styles.messageMeta}>
                                    {message.sender_label} ·{' '}
                                    {message.sender_name} ·{' '}
                                    {formatDate(message.created_at)}
                                </Text>
                                {message.message && (
                                    <Text style={styles.messageBody}>
                                        {message.message}
                                    </Text>
                                )}
                                {message.attachments.length > 0 && (
                                    <View style={styles.attachmentList}>
                                        <Text style={styles.label}>
                                            Attached files
                                        </Text>
                                        {message.attachments.map(
                                            (attachment) => (
                                                <AttachmentLink
                                                    key={`${message.id}-${attachment.name}`}
                                                    attachment={attachment}
                                                />
                                            ),
                                        )}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>
                        Conversation files
                    </Text>
                    {conversationFiles.length === 0 ? (
                        <Text style={styles.empty}>No conversation files.</Text>
                    ) : (
                        conversationFiles.map(
                            ({ attachment, message }, index) => (
                                <View
                                    key={`${message.id}-${attachment.name}-${index}`}
                                    style={styles.fileRow}
                                >
                                    <Text style={styles.label}>
                                        {message.sender_label} ·{' '}
                                        {message.sender_name} ·{' '}
                                        {formatDate(message.created_at)}
                                    </Text>
                                    <AttachmentLink attachment={attachment} />
                                </View>
                            ),
                        )
                    )}
                </View>

                <View style={styles.footer} fixed>
                    <Text>SPRS · {incident.incident_number}</Text>
                    <Text
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
}
