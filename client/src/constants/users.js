export const USERS_ROLE = Object.freeze({
    ADMINISTRATOR: 'ADMINISTRATOR',
    COORDINATOR: 'COORDINATOR',
    DIRECTOR: 'DIRECTOR',
    OFFICER: 'OFFICER',
    MEMBER: 'MEMBER',
});

export const USERS_STATUS = Object.freeze({
    PENDING_PASSWORD: 'PENDING_PASSWORD',
    PENDING_SSO: 'PENDING_SSO',
    VERIFIED: 'VERIFIED',
});

export const USER_SETTINGS_THEME = Object.freeze({
    SYSTEM: 'SYSTEM',
    LIGHT: 'LIGHT',
    DARK: 'DARK',
});

export const USER_SETTINGS_NOTIFICATION = Object.freeze({
    ALL: 'ALL',
    SYSTEM: 'SYSTEM',
    IMPORTANT: 'IMPORTANT',
});
