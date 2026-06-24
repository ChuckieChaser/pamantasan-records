import { z } from 'zod';
import { USERS_ROLE, USERS_STATUS, USER_SETTINGS_THEME, USER_SETTINGS_NOTIFICATION } from '../constants';

// --- Domains ---
export const UsersRoleSchema = z.enum(Object.values(USERS_ROLE));
export const UsersStatusSchema = z.enum(Object.values(USERS_STATUS));
export const UserSettingsThemeSchema = z.enum(Object.values(USER_SETTINGS_THEME));
export const UserSettingsNotificationSchema = z.enum(Object.values(USER_SETTINGS_NOTIFICATION));

// --- Regex Constraints ---
export const UniversityIdSchema = z.string().regex(/^[0-9]{2}-[0-9]{5}$/, 'Invalid University ID format. Must be YY-NNNNN.');
export const EmailSchema = z
    .string()
    .email()
    .regex(/^[A-Za-z0-9._%+-]+@university\.edu\.ph$/, 'Must be a valid @university.edu.ph email address.');

// --- Tables ---
export const UsersSchema = z.object({
    id: z.string().uuid(),
    university_id: UniversityIdSchema,
    department_id: z.string().uuid(),
    role: UsersRoleSchema,

    email: EmailSchema,
    first_name: z.string().min(1),
    middle_name: z.string().nullable().optional(),
    last_name: z.string().min(1),

    status: UsersStatusSchema,
    is_suspended: z.boolean(),

    created_at: z.string().datetime().nullable().optional(),
    updated_at: z.string().datetime().nullable().optional(),
});

export const UserCredentialsSchema = z.object({
    user_id: z.string().uuid(),

    password_hash: z.string(),
    google_id: z.string().nullable().optional(),

    created_at: z.string().datetime().nullable().optional(),
    updated_at: z.string().datetime().nullable().optional(),
});

export const UserSettingsSchema = z.object({
    user_id: z.string().uuid(),

    theme: UserSettingsThemeSchema,
    notification: UserSettingsNotificationSchema,
    animation: z.boolean(),

    created_at: z.string().datetime().nullable().optional(),
    updated_at: z.string().datetime().nullable().optional(),
});

export const UserSessionsSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),

    token_hash: z.string(),
    ip_address: z.string().nullable().optional(),
    user_agent: z.string().nullable().optional(),

    expires_at: z.string().datetime(),
    created_at: z.string().datetime().nullable().optional(),
});
