import { CoordinatorRequestsSchema } from '../../schemas';
import { COORDINATOR_REQUESTS_ACTION, COORDINATOR_REQUESTS_STATUS } from '../../constants';
import { DEPARTMENT_CCS_ID } from './departments';
import { COORDINATOR_ID, ADMINISTRATOR_ID, MEMBER_ID } from './users';

// --- Global Constants ---
export const COORDINATOR_REQUEST_1_ID = 'c0000000-0000-4000-8000-000000000001';
export const COORDINATOR_REQUEST_2_ID = 'c0000000-0000-4000-8000-000000000002';
export const COORDINATOR_REQUEST_3_ID = 'c0000000-0000-4000-8000-000000000003';

const NOW = new Date().toISOString();
const YESTERDAY = new Date(Date.now() - 86400000).toISOString();

// --- Raw Data ---
const rawCoordinatorRequests = [
    {
        id: COORDINATOR_REQUEST_1_ID,
        requester_id: COORDINATOR_ID,
        reviewer_id: null,
        action: COORDINATOR_REQUESTS_ACTION.USER_CREATE,
        data: {
            university_id: '26-00101',
            department_id: DEPARTMENT_CCS_ID,
            role: 'MEMBER',
            email: 'alan.turing@university.edu.ph',
            first_name: 'Alan',
            last_name: 'Turing',
        },
        status: COORDINATOR_REQUESTS_STATUS.PENDING,
        rejection_reason: null,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: COORDINATOR_REQUEST_2_ID,
        requester_id: COORDINATOR_ID,
        reviewer_id: ADMINISTRATOR_ID,
        action: COORDINATOR_REQUESTS_ACTION.DOCUMENT_UPLOAD,
        data: {
            name: 'CCS Budget Q3 2026',
            comment: 'Requesting permission to upload the finalized budget.',
            is_folder: false,
            summary: 'Quarterly financial allocation for computer studies.',
            mime_type: 'application/pdf',
            size_bytes: 4096000,
        },
        status: COORDINATOR_REQUESTS_STATUS.APPROVED,
        rejection_reason: null,
        created_at: YESTERDAY,
        updated_at: NOW,
    },
    {
        id: COORDINATOR_REQUEST_3_ID,
        requester_id: COORDINATOR_ID,
        reviewer_id: ADMINISTRATOR_ID,
        action: COORDINATOR_REQUESTS_ACTION.USER_SUSPEND,
        data: {
            user_id: MEMBER_ID,
            reason: 'Violation of IT security protocol regarding shared passwords.',
        },
        status: COORDINATOR_REQUESTS_STATUS.REJECTED,
        rejection_reason: 'Insufficient evidence provided for suspension. Please conduct a formal review first before escalating.',
        created_at: YESTERDAY,
        updated_at: NOW,
    },
];

// --- Strict Validation ---
export const coordinatorRequestsData = rawCoordinatorRequests.map((cr) => CoordinatorRequestsSchema.parse(cr));
