import { z } from 'zod';
import { COORDINATOR_REQUESTS_ACTION, COORDINATOR_REQUESTS_STATUS } from '../constants';

// --- Domains ---
export const CoordinatorRequestsActionSchema = z.enum(Object.values(COORDINATOR_REQUESTS_ACTION));
export const CoordinatorRequestsStatusSchema = z.enum(Object.values(COORDINATOR_REQUESTS_STATUS));

// --- Tables ---
export const CoordinatorRequestsSchema = z.object({
    id: z.string().uuid(),
    requester_id: z.string().uuid(),
    reviewer_id: z.string().uuid().nullable().optional(),

    action: CoordinatorRequestsActionSchema,
    data: z.record(z.any()),
    status: CoordinatorRequestsStatusSchema,
    rejection_reason: z.string().nullable().optional(),

    created_at: z.string().datetime().nullable().optional(),
    resolved_at: z.string().datetime().nullable().optional(),
});
