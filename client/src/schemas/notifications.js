import { z } from 'zod';
import { NOTIFICATIONS_ENTITY_TYPE, NOTIFICATIONS_ACTION } from '../constants';

// --- Domains ---
export const NotificationsEntityTypeSchema = z.enum(Object.keys(NOTIFICATIONS_ENTITY_TYPE));
export const NotificationsActionSchema = z.enum(Object.keys(NOTIFICATIONS_ACTION));

// --- Tables ---
export const NotificationsSchema = z.object({
    recipient_id: z.string().uuid(),
    actor_ids: z.array(z.string().uuid()).nullable().optional(),

    entity_type: NotificationsEntityTypeSchema,
    entity_id: z.string().uuid(),
    action: NotificationsActionSchema,

    interaction_count: z.number().int().nonnegative(),
    notification_ids: z.array(z.string().uuid()),

    is_read: z.boolean(),

    last_interaction_at: z.string().datetime(),
});
