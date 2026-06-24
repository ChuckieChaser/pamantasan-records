import { z } from 'zod';
import { NOTIFICATIONS_ENTITY_TYPE, NOTIFICATIONS_ACTION } from '../constants';

// --- Domains ---
export const NotificationsEntityTypeSchema = z.enum(Object.values(NOTIFICATIONS_ENTITY_TYPE));
export const NotificationsActionSchema = z.enum(Object.values(NOTIFICATIONS_ACTION));

// --- Tables ---
export const NotificationsSchema = z.object({
    id: z.string().uuid(),
    recipient_id: z.string().uuid(),
    actor_id: z.string().uuid().nullable().optional(),

    entity_type: NotificationsEntityTypeSchema,
    entity_id: z.string().uuid(),
    action: NotificationsActionSchema,

    is_read: z.boolean(),
    is_emailed: z.boolean(),

    created_at: z.string().datetime().nullable().optional(),
});
