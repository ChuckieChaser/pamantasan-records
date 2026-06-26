import { DocumentsSchema, DocumentVersionsSchema, DocumentRequestsSchema, DocumentRequestMessagesSchema, DocumentSharesSchema } from '../../schemas';
import { DOCUMENTS_STATUS, DOCUMENT_REQUESTS_STATUS } from '../../constants';
import { DEPARTMENT_CCS_ID } from './departments';
import { ADMINISTRATOR_ID, DIRECTOR_ID, MEMBER_ID } from './users';

// --- Global Constants ---
export const DOCUMENT_1_ID = 'd0c11111-1111-4111-8111-111111111111';
export const DOCUMENT_2_ID = 'd0c22222-2222-4222-8222-222222222222';
export const DOCUMENT_3_ID = 'd0c33333-3333-4333-8333-333333333333';
export const DOCUMENT_REQUEST_1_ID = '4e911111-1111-4111-8111-111111111111';

const NOW = new Date().toISOString();

// --- Raw Data ---
const rawDocuments = [
    {
        id: DOCUMENT_1_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: 'CS101 Syllabus 2026',
        comment: 'Awaiting Officer review.',
        is_folder: false,
        summary: 'Standard syllabus for introductory computer science.',
        status: DOCUMENTS_STATUS.PENDING_OFFICER,
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
    },
    {
        id: DOCUMENT_2_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: 'Faculty Guidelines',
        comment: null,
        is_folder: false,
        summary: 'Official college rules for the academic year.',
        status: DOCUMENTS_STATUS.PUBLISHED,
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
    },
    {
        id: DOCUMENT_3_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: '2025 Midterm Reference',
        comment: 'Provided upon request.',
        is_folder: false,
        summary: 'Requested past exam material.',
        status: DOCUMENTS_STATUS.ATTACHMENT,
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
    },
];

const rawDocumentVersions = [
    {
        id: '7e511111-1111-4111-8111-111111111111',
        document_id: DOCUMENT_1_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 1,
        checksum: 'abc123hash456',
        path: '/storage/ccs/cs101_syllabus_v1.pdf',
        size_bytes: 1024000,
        mime_type: 'application/pdf',
        change_summary: 'Initial upload',
        rejection_reason: null,
        created_at: NOW,
        rejected_at: null,
    },
    {
        id: '7e522222-2222-4222-8222-222222222222',
        document_id: DOCUMENT_2_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 1,
        checksum: 'xyz789hash012',
        path: '/storage/ccs/faculty_guidelines_v1.pdf',
        size_bytes: 2048000,
        mime_type: 'application/pdf',
        change_summary: 'Official policy document',
        rejection_reason: null,
        created_at: NOW,
        rejected_at: null,
    },
    {
        id: '7e533333-3333-4333-8333-333333333333',
        document_id: DOCUMENT_3_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 1,
        checksum: 'lmn456hash789',
        path: '/storage/ccs/2025_midterm_ref_v1.pdf',
        size_bytes: 512000,
        mime_type: 'application/pdf',
        change_summary: 'Requested attachment uploaded',
        rejection_reason: null,
        created_at: NOW,
        rejected_at: null,
    },
];

const rawDocumentRequests = [
    {
        id: DOCUMENT_REQUEST_1_ID,
        requester_id: MEMBER_ID,
        resolver_id: ADMINISTRATOR_ID,
        subject: 'Requesting access to previous year exams',
        status: DOCUMENT_REQUESTS_STATUS.RESOLVED,
        created_at: NOW,
        updated_at: NOW,
    },
];

const rawDocumentRequestMessages = [
    {
        id: '11151111-1111-4111-8111-111111111111',
        document_request_id: DOCUMENT_REQUEST_1_ID,
        user_id: MEMBER_ID,
        message: 'Can I get the 2025 midterms for reference?',
        created_at: NOW,
    },
    {
        id: '11152222-2222-4222-8222-222222222222',
        document_request_id: DOCUMENT_REQUEST_1_ID,
        user_id: ADMINISTRATOR_ID,
        message: 'Sure, I have attached them to this ticket.',
        created_at: NOW,
    },
];

const rawDocumentShares = [
    {
        id: '54a11111-1111-4111-8111-111111111111',
        document_id: DOCUMENT_1_ID,
        sharer_id: DIRECTOR_ID,
        recipient_id: null,
        department_id: DEPARTMENT_CCS_ID,
        document_request_id: null,
        created_at: NOW,
    },
    {
        id: '54a22222-2222-4222-8222-222222222222',
        document_id: DOCUMENT_2_ID,
        sharer_id: DIRECTOR_ID,
        recipient_id: MEMBER_ID,
        department_id: DEPARTMENT_CCS_ID,
        document_request_id: null,
        created_at: NOW,
    },
    {
        id: '54a33333-3333-4333-8333-333333333333',
        document_id: DOCUMENT_3_ID,
        sharer_id: ADMINISTRATOR_ID,
        recipient_id: MEMBER_ID,
        department_id: null,
        document_request_id: DOCUMENT_REQUEST_1_ID,
        created_at: NOW,
    },
];

// --- Strict Validation ---
export const documentsData = rawDocuments.map((d) => DocumentsSchema.parse(d));
export const documentVersionsData = rawDocumentVersions.map((dv) => DocumentVersionsSchema.parse(dv));
export const documentRequestsData = rawDocumentRequests.map((dr) => DocumentRequestsSchema.parse(dr));
export const documentRequestMessagesData = rawDocumentRequestMessages.map((drm) => DocumentRequestMessagesSchema.parse(drm));
export const documentSharesData = rawDocumentShares.map((ds) => DocumentSharesSchema.parse(ds));
