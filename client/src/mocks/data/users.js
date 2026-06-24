import { UsersSchema, UserCredentialsSchema, UserSettingsSchema, UserSessionsSchema } from '../../schemas';
import { USERS_ROLE, USERS_STATUS, USER_SETTINGS_THEME, USER_SETTINGS_NOTIFICATION } from '../../constants';
import { DEPARTMENT_OUR_ID, DEPARTMENT_HRO_ID, DEPARTMENT_CCS_ID } from './departments';

// --- Global Constants ---
export const ADMINISTRATOR_ID = 'u1111111-1111-1111-1111-111111111111';
export const COORDINATOR_ID = 'u2222222-2222-2222-2222-222222222222';
export const DIRECTOR_ID = 'u3333333-3333-3333-3333-333333333333';
export const OFFICER_ID = 'u4444444-4444-4444-4444-444444444444';
export const MEMBER_ID = 'u5555555-5555-5555-5555-555555555555';

const NOW = new Date().toISOString();

// --- Raw Data ---
const rawUsers = [
    {
        id: ADMINISTRATOR_ID,
        university_id: '00-00001',
        department_id: DEPARTMENT_OUR_ID,
        role: USERS_ROLE.ADMINISTRATOR,
        email: 'admin.sys@university.edu.ph',
        first_name: 'System',
        middle_name: null,
        last_name: 'Administrator',
        status: USERS_STATUS.VERIFIED,
        is_suspended: false,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: COORDINATOR_ID,
        university_id: '15-10234',
        department_id: DEPARTMENT_HRO_ID,
        role: USERS_ROLE.COORDINATOR,
        email: 'hr.coordinator@university.edu.ph',
        first_name: 'Elena',
        middle_name: 'Reyes',
        last_name: 'Bautista',
        status: USERS_STATUS.VERIFIED,
        is_suspended: false,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DIRECTOR_ID,
        university_id: '10-55421',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.DIRECTOR,
        email: 'dean.ccs@university.edu.ph',
        first_name: 'Roberto',
        middle_name: 'Tan',
        last_name: 'Villanueva',
        status: USERS_STATUS.VERIFIED,
        is_suspended: false,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: OFFICER_ID,
        university_id: '18-33214',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.OFFICER,
        email: 'secretary.ccs@university.edu.ph',
        first_name: 'Maria',
        middle_name: 'Santos',
        last_name: 'Dela Cruz',
        status: USERS_STATUS.VERIFIED,
        is_suspended: false,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: MEMBER_ID,
        university_id: '22-88765',
        department_id: DEPARTMENT_CCS_ID,
        role: USERS_ROLE.MEMBER,
        email: 'faculty.ccs@university.edu.ph',
        first_name: 'Juan',
        middle_name: null,
        last_name: 'Perez',
        status: USERS_STATUS.VERIFIED,
        is_suspended: false,
        created_at: NOW,
        updated_at: NOW,
    },
];

const rawUserCredentials = [
    {
        user_id: ADMINISTRATOR_ID,
        password_hash: '$2b$10$FakeHashForAdmin',
        google_id: null,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: COORDINATOR_ID,
        password_hash: '$2b$10$FakeHashForCoord',
        google_id: null,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: DIRECTOR_ID,
        password_hash: '$2b$10$FakeHashForDir',
        google_id: '104857392817',
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: OFFICER_ID,
        password_hash: '$2b$10$FakeHashForOfficer',
        google_id: null,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: MEMBER_ID,
        password_hash: '$2b$10$FakeHashForMember',
        google_id: null,
        created_at: NOW,
        updated_at: NOW,
    },
];

const rawUserSettings = [
    {
        user_id: ADMINISTRATOR_ID,
        theme: USER_SETTINGS_THEME.DARK,
        notification: USER_SETTINGS_NOTIFICATION.ALL,
        animation: false,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: COORDINATOR_ID,
        theme: USER_SETTINGS_THEME.SYSTEM,
        notification: USER_SETTINGS_NOTIFICATION.IMPORTANT,
        animation: true,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: DIRECTOR_ID,
        theme: USER_SETTINGS_THEME.LIGHT,
        notification: USER_SETTINGS_NOTIFICATION.ALL,
        animation: true,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: OFFICER_ID,
        theme: USER_SETTINGS_THEME.SYSTEM,
        notification: USER_SETTINGS_NOTIFICATION.ALL,
        animation: true,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        user_id: MEMBER_ID,
        theme: USER_SETTINGS_THEME.DARK,
        notification: USER_SETTINGS_NOTIFICATION.SYSTEM,
        animation: true,
        created_at: NOW,
        updated_at: NOW,
    },
];

const rawUserSessions = [
    {
        id: 's1111111-1111-1111-1111-111111111111',
        user_id: ADMINISTRATOR_ID,
        token_hash: 'abc123xyz',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: NOW,
    },
];

// --- Strict Validation ---
export const usersData = rawUsers.map((user) => UsersSchema.parse(user));
export const userCredentialsData = rawUserCredentials.map((userCredential) => UserCredentialsSchema.parse(userCredential));
export const userSettingsData = rawUserSettings.map((userSetting) => UserSettingsSchema.parse(userSetting));
export const userSessionsData = rawUserSessions.map((userSession) => UserSessionsSchema.parse(userSession));
