import { z } from 'zod';

// --- Tables ---
export const DepartmentsSchema = z.object({
    id: z.string().uuid(),

    name: z.string().min(1, 'Department name is required'),
    code: z.string().min(1, 'Department code is required'),

    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
