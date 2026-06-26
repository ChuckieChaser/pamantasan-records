import { z } from 'zod';
import { AUDIT_LOGS_ENTITY_TYPE, AUDIT_LOGS_ACTION } from '../constants';

// --- Domains ---
export const AuditLogsEntityTypeSchema = z.enum(Object.keys(AUDIT_LOGS_ENTITY_TYPE));
export const AuditLogsActionSchema = z.enum(Object.keys(AUDIT_LOGS_ACTION));

// --- Tables ---
export const AuditLogsSchema = z.object({
    id: z.string().uuid(),
    actor_id: z.string().uuid().nullable().optional(),

    entity_type: AuditLogsEntityTypeSchema,
    entity_id: z.string().uuid(),

    action: AuditLogsActionSchema,
    data: z.record(z.any()),

    created_at: z.string().datetime().nullable().optional(),
});
