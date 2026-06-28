import { UsersSchema, UserCredentialsSchema, UserSettingsSchema, UserSessionsSchema } from '../../schemas';
import { USERS_ROLE, USERS_STATUS, USER_SETTINGS_THEME, USER_SETTINGS_NOTIFICATION } from '../../constants';
import { DEPARTMENT_CCS_ID, DEPARTMENT_HR_ID } from './departments';

// --- Global Constants ---
export const ADMINISTRATOR_ID = 'u1111111-1111-4111-8111-111111111111';
export const COORDINATOR_ID = 'u2222222-2222-4222-8222-222222222222';
export const DIRECTOR_ID = 'u3333333-3333-4333-8333-333333333333';
export const OFFICER_ID = 'u4444444-4444-4444-8444-444444444444';
export const MEMBER_ID = 'u5555555-5555-4555-8555-555555555555';
export const HR_MEMBER_ID = 'u6666666-6666-4666-8666-666666666666';

const now = new Date().toISOString();

// --- Raw Data ---
const rawUsers = [
    {
        id: ADMINISTRATOR_ID,
        university_id: '20-00001',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.ADMINISTRATOR,
        email: 'admin.ccs@university.edu.ph',
        first_name: 'Arthur',
        last_name: 'Pendragon',
        status: USERS_STATUS.VERIFIED,
        created_at: now,
        updated_at: now,
    },
    {
        id: COORDINATOR_ID,
        university_id: '20-00002',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.COORDINATOR,
        email: 'coord.ccs@university.edu.ph',
        first_name: 'Cora',
        last_name: 'Smith',
        status: USERS_STATUS.VERIFIED,
        created_at: now,
        updated_at: now,
    },
    {
        id: DIRECTOR_ID,
        university_id: '20-00003',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.DIRECTOR,
        email: 'director.ccs@university.edu.ph',
        first_name: 'Diana',
        last_name: 'Prince',
        status: USERS_STATUS.VERIFIED,
        created_at: now,
        updated_at: now,
    },
    {
        id: OFFICER_ID,
        university_id: '20-00004',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.OFFICER,
        email: 'officer.ccs@university.edu.ph',
        first_name: 'Oliver',
        last_name: 'Queen',
        status: USERS_STATUS.VERIFIED,
        created_at: now,
        updated_at: now,
    },
    {
        id: MEMBER_ID,
        university_id: '20-00005',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.MEMBER,
        email: 'member.ccs@university.edu.ph',
        first_name: 'Marcus',
        last_name: 'Aurelius',
        status: USERS_STATUS.VERIFIED,
        created_at: now,
        updated_at: now,
    },
    {
        id: HR_MEMBER_ID,
        university_id: '21-00123',
        department_id: DEPARTMENT_HR_ID,
        role: USERS_ROLE.MEMBER,
        email: 'member.hr@university.edu.ph',
        first_name: 'Helena',
        last_name: 'Roosevelt',
        status: USERS_STATUS.VERIFIED,
        created_at: now,
        updated_at: now,
    },
];

const rawUserCredentials = rawUsers.map((user) => ({
    user_id: user.id,
    password_hash: '$2b$10$abcdefghijklmnopqrstuv',
    google_id: user.id === ADMINISTRATOR_ID ? '10485739281' : null,
    created_at: now,
    updated_at: now,
}));

const rawUserSettings = rawUsers.map((user, index) => ({
    user_id: user.id,
    theme: index % 2 === 0 ? USER_SETTINGS_THEME.SYSTEM : USER_SETTINGS_THEME.DARK,
    notification: USER_SETTINGS_NOTIFICATION.ALL,
    animation: true,
    created_at: now,
    updated_at: now,
}));

const rawUserSessions = [
    {
        id: 's0000000-0000-4000-8000-000000000001',
        user_id: ADMINISTRATOR_ID,
        token_hash: 'mock_jwt_token_admin_123',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: now,
        expired_at: new Date(Date.now() + 86400000).toISOString(),
    },
    {
        id: 's0000000-0000-4000-8000-000000000002',
        user_id: HR_MEMBER_ID,
        token_hash: 'mock_jwt_token_hr_456',
        ip_address: '10.0.0.55',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: now,
        expired_at: new Date(Date.now() + 86400000).toISOString(),
    },
];

// --- Strict Validation ---
export const usersData = rawUsers.map((u) => UsersSchema.parse(u));
export const userCredentialsData = rawUserCredentials.map((uc) => UserCredentialsSchema.parse(uc));
export const userSettingsData = rawUserSettings.map((us) => UserSettingsSchema.parse(us));
export const userSessionsData = rawUserSessions.map((us) => UserSessionsSchema.parse(us));
