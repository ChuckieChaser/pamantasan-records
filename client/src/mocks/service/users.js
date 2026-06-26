import { usersData, userCredentialsData, userSettingsData, userSessionsData } from '../data';
import { USERS_STATUS, USER_SETTINGS_THEME, USER_SETTINGS_NOTIFICATION } from '../../constants';

const DELAY_MS = 500;

export const mockUsersService = {
    // --- Reads ---
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
    getByUniversityId: async (universityId) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = usersData.find((u) => u.university_id === universityId);
                user ? resolve({ ...user }) : reject(new Error('User not found'));
            }, DELAY_MS);
        });
    },
    getByDepartmentId: async (departmentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = usersData.filter((u) => u.department_id === departmentId);
                resolve(users);
            }, DELAY_MS);
        });
    },
    getByRole: async (role) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = usersData.filter((u) => u.role === role);
                resolve(users);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    id: crypto.randomUUID(),
                    ...data,
                    status: USERS_STATUS.PENDING_PASSWORD,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                usersData.push(user);
                resolve(user);
            }, DELAY_MS);
        });
    },
    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = usersData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('User not found'));

                usersData[index] = {
                    ...usersData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(usersData[index]);
            }, DELAY_MS);
        });
    },
};

export const mockUserCredentialsService = {
    // --- Reads ---
    getByUserId: async (userId) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const userCredential = userCredentialsData.find((uc) => uc.user_id === userId);
                userCredential ? resolve({ ...userCredential }) : reject(new Error('Credentials not found for this user'));
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const userCredential = {
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                userCredentialsData.push(userCredential);
                resolve(userCredential);
            }, DELAY_MS);
        });
    },
    update: async (userId, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = userCredentialsData.findIndex((i) => i.user_id === userId);
                if (index === -1) return reject(new Error('Credentials not found'));

                userCredentialsData[index] = {
                    ...userCredentialsData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(userCredentialsData[index]);
            }, DELAY_MS);
        });
    },
};

export const mockUserSettingsService = {
    // --- Reads ---
    getByUserId: async (userId) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const userSetting = userSettingsData.find((us) => us.user_id === userId);
                userSetting ? resolve({ ...userSetting }) : reject(new Error('Settings not found for this user'));
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (user_id) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const userSetting = {
                    user_id,
                    theme: USER_SETTINGS_THEME.SYSTEM,
                    notification: USER_SETTINGS_NOTIFICATION.ALL,
                    animation: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                userSettingsData.push(userSetting);
                resolve(userSetting);
            }, DELAY_MS);
        });
    },
    update: async (userId, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = userSettingsData.findIndex((i) => i.user_id === userId);
                if (index === -1) return reject(new Error('Settings not found'));

                userSettingsData[index] = {
                    ...userSettingsData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(userSettingsData[index]);
            }, DELAY_MS);
        });
    },
};

export const mockUserSessionsService = {
    // --- Reads ---
    getByUserId: async (userId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const userSessions = userSessionsData.filter((us) => us.user_id === userId);
                resolve(userSessions);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const userSession = {
                    id: crypto.randomUUID(),
                    ...data,
                    created_at: new Date().toISOString(),
                };

                userSessionsData.push(userSession);
                resolve(userSession);
            }, DELAY_MS);
        });
    },
    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = userSessionsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Session not found'));

                userSessionsData.splice(index, 1);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};
