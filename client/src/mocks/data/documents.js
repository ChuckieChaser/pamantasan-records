import { DocumentsSchema, DocumentVersionsSchema, DocumentRequestsSchema, DocumentRequestMessagesSchema, DocumentSharesSchema } from '../../schemas';
import { DOCUMENTS_STATUS, DOCUMENT_REQUESTS_STATUS } from '../../constants';
import { DEPARTMENT_CCS_ID } from './departments';
import { ADMINISTRATOR_ID, DIRECTOR_ID, MEMBER_ID, HR_MEMBER_ID } from './users';

// --- Global Constants ---
export const FOLDER_1_ID = 'd0000000-0000-4000-8000-000000000001';
export const DOCUMENT_1_ID = 'd0000000-0000-4000-8000-000000000002';
export const DOCUMENT_2_ID = 'd0000000-0000-4000-8000-000000000003';
export const DOCUMENT_3_ID = 'd0000000-0000-4000-8000-000000000004';

export const DOCUMENT_REQUEST_1_ID = 'r0000000-0000-4000-8000-000000000001';
export const DOCUMENT_REQUEST_2_ID = 'r0000000-0000-4000-8000-000000000002';

const NOW = new Date().toISOString();
const TWO_DAYS_AGO = new Date(Date.now() - 172800000).toISOString();

// --- Raw Data ---
const rawDocuments = [
    {
        id: FOLDER_1_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: '2026 Academic Guidelines',
        comment: 'Root folder for the upcoming academic year.',
        is_folder: true,
        summary: null,
        embedding: null,
        status: DOCUMENTS_STATUS.PUBLISHED,
        created_at: TWO_DAYS_AGO,
        updated_at: TWO_DAYS_AGO,
    },
    {
        id: DOCUMENT_1_ID,
        parent_id: FOLDER_1_ID,
        uploader_id: ADMINISTRATOR_ID,
        name: 'CS101_Syllabus_Draft.pdf',
        comment: 'Awaiting Officer review before Director approval.',
        is_folder: false,
        summary: 'Introductory programming syllabus focusing on Python and basic algorithms.',
        embedding: null,
        status: DOCUMENTS_STATUS.PENDING_OFFICER,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DOCUMENT_2_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: 'Q3_Financial_Allocation.xlsx',
        comment: 'Approved by Director. Ready for distribution.',
        is_folder: false,
        summary: 'Departmental budget allocations for the third quarter.',
        embedding: null,
        status: DOCUMENTS_STATUS.PUBLISHED,
        created_at: TWO_DAYS_AGO,
        updated_at: NOW,
    },
    {
        id: DOCUMENT_3_ID,
        parent_id: null,
        uploader_id: ADMINISTRATOR_ID,
        name: 'IT_Security_Policy_v2.pdf',
        comment: 'Requested file for HR.',
        is_folder: false,
        summary: 'Updated guidelines for password rotation and two-factor authentication.',
        embedding: null,
        status: DOCUMENTS_STATUS.ATTACHMENT,
        created_at: NOW,
        updated_at: NOW,
    },
];

const rawDocumentVersions = [
    {
        id: 'v0000000-0000-4000-8000-000000000001',
        document_id: DOCUMENT_1_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 1,
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        path: '/storage/docs/cs101_v1.pdf',
        size_bytes: 1048576,
        mime_type: 'application/pdf',
        change_summary: 'Initial draft upload.',
        rejection_reason: null,
        created_at: NOW,
        rejected_at: null,
    },
    {
        id: 'v0000000-0000-4000-8000-000000000002',
        document_id: DOCUMENT_2_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: DIRECTOR_ID,
        version: 1,
        checksum: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        path: '/storage/docs/q3_finance_v1.xlsx',
        size_bytes: 512000,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        change_summary: 'Initial budget calculation.',
        rejection_reason: 'Please adjust the hardware allocation for CCS.',
        created_at: TWO_DAYS_AGO,
        rejected_at: TWO_DAYS_AGO,
    },
    {
        id: 'v0000000-0000-4000-8000-000000000003',
        document_id: DOCUMENT_2_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 2,
        checksum: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        path: '/storage/docs/q3_finance_v2.xlsx',
        size_bytes: 524000,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        change_summary: 'Hardware allocation adjusted per Director feedback.',
        rejection_reason: null,
        created_at: NOW,
        rejected_at: null,
    },
    {
        id: 'v0000000-0000-4000-8000-000000000004',
        document_id: DOCUMENT_3_ID,
        uploader_id: ADMINISTRATOR_ID,
        rejecter_id: null,
        version: 1,
        checksum: 'b2ca6b0bac6105445211993427181054521b1070e67e3fb1070e67e3fb1070e6',
        path: '/storage/docs/it_security.pdf',
        size_bytes: 2048000,
        mime_type: 'application/pdf',
        change_summary: 'Requested attachment.',
        rejection_reason: null,
        created_at: NOW,
        rejected_at: null,
    },
];

const rawDocumentRequests = [
    {
        id: DOCUMENT_REQUEST_1_ID,
        requester_id: MEMBER_ID,
        resolver_id: null,
        subject: 'Need the updated grading rubrics for midterm exams.',
        status: DOCUMENT_REQUESTS_STATUS.OPEN,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DOCUMENT_REQUEST_2_ID,
        requester_id: HR_MEMBER_ID,
        resolver_id: ADMINISTRATOR_ID,
        subject: 'Requesting the latest IT Security Policy for employee onboarding.',
        status: DOCUMENT_REQUESTS_STATUS.RESOLVED,
        created_at: TWO_DAYS_AGO,
        updated_at: NOW,
    },
];

const rawDocumentRequestMessages = [
    {
        id: 'm0000000-0000-4000-8000-000000000001',
        document_request_id: DOCUMENT_REQUEST_1_ID,
        user_id: MEMBER_ID,
        message: 'Hi Admin, I cannot find the 2026 grading rubrics. Can you provide them?',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'm0000000-0000-4000-8000-000000000002',
        document_request_id: DOCUMENT_REQUEST_1_ID,
        user_id: ADMINISTRATOR_ID,
        message: 'I am currently drafting them. They will be uploaded later today.',
        created_at: NOW,
    },
];

const rawDocumentShares = [
    {
        id: 's0000000-0000-4000-8000-000000000001',
        document_id: DOCUMENT_2_ID,
        sharer_id: ADMINISTRATOR_ID,
        recipient_id: null,
        department_id: DEPARTMENT_CCS_ID,
        document_request_id: null,
        created_at: NOW,
    },
    {
        id: 's0000000-0000-4000-8000-000000000002',
        document_id: DOCUMENT_3_ID,
        sharer_id: ADMINISTRATOR_ID,
        recipient_id: HR_MEMBER_ID,
        department_id: null,
        document_request_id: DOCUMENT_REQUEST_2_ID,
        created_at: NOW,
    },
];

// --- Strict Validation ---
export const documentsData = rawDocuments.map((d) => DocumentsSchema.parse(d));
export const documentVersionsData = rawDocumentVersions.map((dv) => DocumentVersionsSchema.parse(dv));
export const documentRequestsData = rawDocumentRequests.map((dr) => DocumentRequestsSchema.parse(dr));
export const documentRequestMessagesData = rawDocumentRequestMessages.map((drm) => DocumentRequestMessagesSchema.parse(drm));
export const documentSharesData = rawDocumentShares.map((ds) => DocumentSharesSchema.parse(ds));
