import { AuditLogsSchema } from '../../schemas';
import { AUDIT_LOGS_ENTITY_TYPE, AUDIT_LOGS_ACTION } from '../../constants';
import { ADMINISTRATOR_ID, MEMBER_ID } from './users';
import { DOCUMENT_1_ID, DOCUMENT_REQUEST_1_ID } from './documents';
import { COORDINATOR_REQUEST_2_ID } from './coordinators';

// --- Global Constants ---
export const AUDIT_LOG_1_ID = 'a0d11111-1111-4111-8111-111111111111';
export const AUDIT_LOG_2_ID = 'a0d22222-2222-4222-8222-222222222222';
export const AUDIT_LOG_3_ID = 'a0d33333-3333-4333-8333-333333333333';

const NOW = new Date().toISOString();

// --- Raw Data ---
const rawAuditLogs = [
    {
        id: AUDIT_LOG_1_ID,
        actor_id: ADMINISTRATOR_ID,
        entity_type: AUDIT_LOGS_ENTITY_TYPE.DOCUMENT,
        entity_id: DOCUMENT_1_ID,
        action: AUDIT_LOGS_ACTION.CREATED,
        data: {
            ip_address: '192.168.1.50',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            changes: {
                name: 'CS101 Syllabus 2026',
                status: 'PENDING_OFFICER',
            },
            system_note: 'Initial document record created by Administrator override.',
        },
        created_at: new Date(Date.now() - 2500000).toISOString(),
    },
    {
        id: AUDIT_LOG_2_ID,
        actor_id: MEMBER_ID,
        entity_type: AUDIT_LOGS_ENTITY_TYPE.DOCUMENT_REQUEST,
        entity_id: DOCUMENT_REQUEST_1_ID,
        action: AUDIT_LOGS_ACTION.CREATED,
        data: {
            ip_address: '10.0.0.15',
            user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            payload: {
                subject: 'Requesting access to previous year midterm exams for reference',
                status: 'OPEN',
            },
        },
        created_at: new Date(Date.now() - 1200000).toISOString(),
    },
    {
        id: AUDIT_LOG_3_ID,
        actor_id: ADMINISTRATOR_ID,
        entity_type: AUDIT_LOGS_ENTITY_TYPE.COORDINATOR_REQUEST,
        entity_id: COORDINATOR_REQUEST_2_ID,
        action: AUDIT_LOGS_ACTION.UPDATED,
        data: {
            ip_address: '192.168.1.50',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            changes: {
                status: {
                    previous: 'PENDING',
                    current: 'APPROVED',
                },
                reviewer_id: ADMINISTRATOR_ID,
            },
            system_note: 'Maker-Checker approval sequence initiated. Payload transferred to core tables.',
        },
        created_at: NOW,
    },
];

// --- Strict Validation ---
export const auditLogsData = rawAuditLogs.map((al) => AuditLogsSchema.parse(al));
