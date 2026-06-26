import { DocumentsSchema, DocumentVersionsSchema, DocumentRequestsSchema, DocumentRequestMessagesSchema, DocumentSharesSchema } from '../../schemas';
import { DOCUMENTS_STATUS, DOCUMENT_REQUESTS_STATUS } from '../../constants';
import { DEPARTMENT_CCS_ID } from './departments';
import { ADMINISTRATOR_ID, DIRECTOR_ID, MEMBER_ID } from './users';

// --- Global Constants ---
export const DOCUMENT_1_ID = 'd0c11111-1111-4111-8111-111111111111';
export const DOCUMENT_2_ID = 'd0c22222-2222-4222-8222-222222222222';
export const DOCUMENT_3_ID = 'd0c33333-3333-4333-8333-333333333333';
export const DOCUMENT_4_ID = 'd0c44444-4444-4444-8444-444444444444';
export const DOCUMENT_REQUEST_1_ID = '4e911111-1111-4111-8111-111111111111';

const NOW = new Date().toISOString();
const LAST_WEEK = new Date(Date.now() - 604800000).toISOString();

// --- Raw Data ---
const rawDocuments = [
    {
        id: DOCUMENT_1_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: 'CS101 Syllabus 2026',
        comment: 'Awaiting Officer review. Please check the new AI guidelines section.',
        is_folder: false,
        summary: 'Standard syllabus for introductory computer science.',
        status: DOCUMENTS_STATUS.PENDING_OFFICER,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DOCUMENT_2_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: 'CCS Faculty Guidelines 2025',
        comment: null,
        is_folder: false,
        summary: 'Official college rules, attendance policies, and grading metrics.',
        status: DOCUMENTS_STATUS.PUBLISHED,
        created_at: LAST_WEEK,
        updated_at: LAST_WEEK,
    },
    {
        id: DOCUMENT_3_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: '2025 Midterm Reference Material',
        comment: 'Provided strictly upon helpdesk request.',
        is_folder: false,
        summary: 'Requested past exam material for instructional alignment.',
        status: DOCUMENTS_STATUS.ATTACHMENT,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DOCUMENT_4_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: 'Legacy Curriculum 2018',
        comment: 'Replaced by the 2024 revised curriculum.',
        is_folder: false,
        summary: 'Outdated curriculum matrix. Kept for historical auditing only.',
        status: DOCUMENTS_STATUS.ARCHIVED,
        created_at: new Date('2018-05-12T08:00:00Z').toISOString(),
        updated_at: NOW,
    },
];

const rawDocumentVersions = [
    {
        id: '7e511111-1111-4111-8111-111111111111',
        document_id: DOCUMENT_1_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 1,
        checksum: 'a8b9cdef1234567890abcdef12345678',
        path: '/storage/ccs/cs101_syllabus_2026_v1.pdf',
        size_bytes: 1450230,
        mime_type: 'application/pdf',
        change_summary: 'Initial upload mapping the new semester.',
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
        checksum: 'f1e2d3c4b5a69876543210fedcba0987',
        path: '/storage/ccs/faculty_guidelines_final.pdf',
        size_bytes: 3204800,
        mime_type: 'application/pdf',
        change_summary: 'Official policy document approved by Director.',
        rejection_reason: null,
        created_at: LAST_WEEK,
        rejected_at: null,
    },
    {
        id: '7e533333-3333-4333-8333-333333333333',
        document_id: DOCUMENT_3_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 1,
        checksum: '99999999999999999999999999999999',
        path: '/storage/ccs/2025_midterm_ref_v1.pdf',
        size_bytes: 512000,
        mime_type: 'application/pdf',
        change_summary: 'Helpdesk attachment generated.',
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
        subject: 'Requesting access to previous year midterm exams for reference',
        status: DOCUMENT_REQUESTS_STATUS.RESOLVED,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: NOW,
    },
];

const rawDocumentRequestMessages = [
    {
        id: '11151111-1111-4111-8111-111111111111',
        document_request_id: DOCUMENT_REQUEST_1_ID,
        user_id: MEMBER_ID,
        message: 'Hello! I am updating the test bank and need to ensure I do not duplicate the questions from the 2025 midterms. Can I get a copy for reference?',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: '11152222-2222-4222-8222-222222222222',
        document_request_id: DOCUMENT_REQUEST_1_ID,
        user_id: ADMINISTRATOR_ID,
        message: 'Request approved. I have attached the requested materials to this ticket. Please ensure they remain confidential.',
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
        recipient_id: null,
        department_id: DEPARTMENT_CCS_ID,
        document_request_id: null,
        created_at: LAST_WEEK,
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
