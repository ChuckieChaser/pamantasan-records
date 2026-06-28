import { AuditLogsSchema } from '../../schemas';
import { AUDIT_LOGS_ENTITY_TYPE, AUDIT_LOGS_ACTION } from '../../constants';
import { ADMINISTRATOR_ID, COORDINATOR_ID, HR_MEMBER_ID } from './users';
import { DOCUMENT_1_ID } from './documents';
import { COORDINATOR_REQUEST_1_ID } from './coordinators';

// --- Global Constants ---
export const AUDIT_LOG_1_ID = 'a0000000-0000-4000-8000-000000000001';
export const AUDIT_LOG_2_ID = 'a0000000-0000-4000-8000-000000000002';
export const AUDIT_LOG_3_ID = 'a0000000-0000-4000-8000-000000000003';
export const AUDIT_LOG_4_ID = 'a0000000-0000-4000-8000-000000000004';

const NOW = new Date().toISOString();
const TWO_HOURS_AGO = new Date(Date.now() - 7200000).toISOString();
const YESTERDAY = new Date(Date.now() - 86400000).toISOString();
const TWO_DAYS_AGO = new Date(Date.now() - 172800000).toISOString();

// --- Raw Data ---
const rawAuditLogs = [
    {
        id: AUDIT_LOG_1_ID,
        actor_id: ADMINISTRATOR_ID,
        entity_type: AUDIT_LOGS_ENTITY_TYPE.DOCUMENT,
        entity_id: DOCUMENT_1_ID,
        action: AUDIT_LOGS_ACTION.UPLOADED,
        data: {
            ip_address: '192.168.1.100',
            user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            file_name: 'CS101_Syllabus_Draft.pdf',
            size_bytes: 1048576,
        },
        created_at: NOW,
    },
    {
        id: AUDIT_LOG_2_ID,
        actor_id: COORDINATOR_ID,
        entity_type: AUDIT_LOGS_ENTITY_TYPE.COORDINATOR_REQUEST,
        entity_id: COORDINATOR_REQUEST_1_ID,
        action: AUDIT_LOGS_ACTION.CREATED,
        data: {
            ip_address: '10.0.0.45',
            request_type: 'USER_CREATE',
            target_department: 'CCS',
        },
        created_at: TWO_HOURS_AGO,
    },
    {
        id: AUDIT_LOG_3_ID,
        actor_id: ADMINISTRATOR_ID,
        entity_type: AUDIT_LOGS_ENTITY_TYPE.USER,
        entity_id: HR_MEMBER_ID,
        action: AUDIT_LOGS_ACTION.UPDATED,
        data: {
            ip_address: '192.168.1.100',
            changes: {
                status: {
                    old: 'PENDING_PASSWORD',
                    new: 'VERIFIED',
                },
            },
        },
        created_at: YESTERDAY,
    },
    {
        id: AUDIT_LOG_4_ID,
        actor_id: null,
        entity_type: AUDIT_LOGS_ENTITY_TYPE.DEPARTMENT,
        entity_id: 'd0000000-0000-4000-8000-000000000001',
        action: AUDIT_LOGS_ACTION.UPDATED,
        data: {
            trigger: 'CRON_JOB',
            reason: 'Automated organizational code sync with University Mainframe.',
        },
        created_at: TWO_DAYS_AGO,
    },
];

// --- Strict Validation ---
export const auditLogsData = rawAuditLogs.map((al) => AuditLogsSchema.parse(al));
