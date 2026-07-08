import { z } from 'zod';
import { DOCUMENTS_STATUS, DOCUMENT_REQUESTS_STATUS } from '../constants';

// --- Domains ---
export const DocumentsStatusSchema = z.enum(Object.keys(DOCUMENTS_STATUS));
export const DocumentRequestsStatusSchema = z.enum(Object.keys(DOCUMENT_REQUESTS_STATUS));

// --- Tables ---
export const DocumentsSchema = z.object({
    id: z.string().uuid(),
    parent_id: z.string().uuid().nullable().optional(),
    uploader_id: z.string().uuid(),

    name: z.string().min(1),
    comment: z.string().nullable().optional(),
    is_folder: z.boolean(),
    summary: z.string().nullable().optional(),
    embedding: z
        .array(z.number())
        .nullable()
        .optional()
        .refine((v) => v == null || v.length === 1536, { message: 'Embedding vector must be length 1536 when present.' }),

    status: DocumentsStatusSchema,

    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export const DocumentVersionsSchema = z.object({
    id: z.string().uuid(),
    document_id: z.string().uuid(),
    uploader_id: z.string().uuid(),
    approver_id: z.string().uuid().nullable().optional(),
    publisher_id: z.string().uuid().nullable().optional(),
    rejecter_id: z.string().uuid().nullable().optional(),

    version: z.number().int().positive(),
    checksum: z.string().nullable().optional(),
    path: z.string(),
    size_bytes: z.number().int().nonnegative(),
    mime_type: z.string(),

    change_summary: z.string().nullable().optional(),
    rejection_reason: z.string().nullable().optional(),

    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export const DocumentRequestsSchema = z.object({
    id: z.string().uuid(),
    requester_id: z.string().uuid(),
    resolver_id: z.string().uuid().nullable().optional(),

    subject: z.string().min(1),
    status: DocumentRequestsStatusSchema,

    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export const DocumentRequestMessagesSchema = z.object({
    id: z.string().uuid(),
    document_request_id: z.string().uuid(),
    user_id: z.string().uuid().nullable().optional(),

    message: z.string().min(1),

    created_at: z.string().datetime(),
});

export const DocumentSharesSchema = z
    .object({
        id: z.string().uuid(),
        document_id: z.string().uuid(),
        sharer_id: z.string().uuid(),
        recipient_id: z.string().uuid().nullable().optional(),

        department_id: z.string().uuid().nullable().optional(),
        document_request_id: z.string().uuid().nullable().optional(),

        created_at: z.string().datetime(),
    })
    .refine(
        (data) => {
            const hasDepartmentId = data.department_id != null;
            const hasDocumentRequestId = data.document_request_id != null;

            return (hasDepartmentId && !hasDocumentRequestId) || (!hasDepartmentId && hasDocumentRequestId);
        },
        { message: 'A document share must route to EITHER a department OR a document request ticket, not both.' }
    );
