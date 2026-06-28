import { create } from 'zustand';
import { userSessionsService } from '../../services';
import { action } from '../utilities';

export const useUserSession = create((set, get) => ({
    // --- States ---
    userSessions: [],
    isLoading: false,
    error: null,

    // --- Reads ---
    getByUserId: action(set, async (userId) => {
        const userSessions = await userSessionsService.getByUserId(userId).catch(() => []);

        set({ userSessions: userSessions });
        return userSessions;
    }),

    // --- Actions ---
    create: action(set, async (data) => {
        const createdUserSession = await userSessionsService.create(data);

        const userSessions = get().userSessions;
        const newUserSessions = [...userSessions, createdUserSession];

        set({ userSessions: newUserSessions });
        return createdUserSession;
    }),
    delete: action(set, async (id) => {
        await userSessionsService.delete(id);

        const userSessions = get().userSessions;
        const newUserSessions = userSessions.filter((nus) => nus.id !== id);

        set({ userSessions: newUserSessions });
        return id;
    }),
}));
