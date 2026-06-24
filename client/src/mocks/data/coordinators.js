import { CoordinatorRequestsSchema } from '../../schemas';
import { COORDINATOR_REQUESTS_ACTION, COORDINATOR_REQUESTS_STATUS } from '../../constants';
import { DEPARTMENT_CCS_ID } from './departments';
import { COORDINATOR_ID, ADMINISTRATOR_ID } from './users';

// --- Global Constants ---
export const COORDINATOR_REQUEST_1_ID = 'crq11111-1111-1111-1111-111111111111';
export const COORDINATOR_REQUEST_2_ID = 'crq22222-2222-2222-2222-222222222222';
export const COORDINATOR_REQUEST_3_ID = 'crq33333-3333-3333-3333-333333333333';

const NOW = new Date().toISOString();

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
            email: 'new.faculty@university.edu.ph',
            first_name: 'Ana',
            middle_name: null,
            last_name: 'Dizon',
        },
        status: COORDINATOR_REQUESTS_STATUS.PENDING,
        rejection_reason: null,
        created_at: NOW,
        resolved_at: null,
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
        created_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: NOW,
    },
    {
        id: COORDINATOR_REQUEST_3_ID,
        requester_id: COORDINATOR_ID,
        reviewer_id: ADMINISTRATOR_ID,
        action: COORDINATOR_REQUESTS_ACTION.USER_SUSPEND,
        data: {
            user_id: 'u6666666-6666-6666-6666-666666666666',
            reason: 'Violation of IT security protocol regarding shared passwords.',
        },
        status: COORDINATOR_REQUESTS_STATUS.REJECTED,
        rejection_reason: 'Insufficient evidence provided for suspension. Please conduct a formal review first.',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        resolved_at: NOW,
    },
];

// --- Strict Validation ---
export const coordinatorRequestsData = rawCoordinatorRequests.map((coordinatorRequest) => CoordinatorRequestsSchema.parse(coordinatorRequest));
