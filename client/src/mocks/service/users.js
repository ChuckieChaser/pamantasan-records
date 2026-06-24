import { usersData, userCredentialsData, userSettingsData, userSessionsData } from '../data/users';

const DELAY_MS = 500;

// --- Users Service ---
export const mockUsersService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = [...usersData];
                resolve(users);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = usersData.find((u) => u.id === id);
                user ? resolve({ ...user }) : reject(new Error('User not found'));
            }, DELAY_MS);
        });
    },
    getByDepartmentId: async (departmentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = usersData.filter((user) => user.department_id === departmentId);
                resolve(users);
            }, DELAY_MS);
        });
    },
    getByRole: async (role) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = usersData.filter((user) => user.role === role);
                resolve(users);
            }, DELAY_MS);
        });
    },
};

// --- User Credentials Service ---
export const mockUserCredentialsService = {
    getByUserId: async (userId) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const userCredentials = userCredentialsData.find((userCredential) => userCredential.user_id === userId);
                userCredentials ? resolve({ ...userCredentials }) : reject(new Error('Credentials not found for this user'));
            }, DELAY_MS);
        });
    },
};

// --- User Settings Service ---
export const mockUserSettingsService = {
    getByUserId: async (userId) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const userSettings = userSettingsData.find((userSetting) => userSetting.user_id === userId);
                userSettings ? resolve({ ...userSettings }) : reject(new Error('Settings not found for this user'));
            }, DELAY_MS);
        });
    },
};

// --- User Sessions Service ---
export const mockUserSessionsService = {
    getByUserId: async (userId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const userSessions = userSessionsData.filter((userSession) => userSession.user_id === userId);
                resolve(userSessions);
            }, DELAY_MS);
        });
    },
};
