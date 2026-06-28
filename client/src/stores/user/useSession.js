import { create } from 'zustand';
import { userSessionsService } from '../../services';
import { action } from '../utilities';

export const useUserSession = create((set, get) => ({
    // --- States ---
    activeUserSessions: [],
    isLoading: false,
    error: null,

    // --- Locals ---
    selectActiveSessions: action(set, async (userId) => {
        const activeUserSessions = await userSessionsService.getByUserId(userId).catch(() => []);

        set({ activeUserSessions: activeUserSessions });
        return activeUserSessions;
    }),
    deselectActiveSessions: () => {
        set({ activeUserSessions: [] });
    },

    // --- Actions ---
    create: action(set, async (data) => {
        const createdUserSession = await userSessionsService.create(data);

        const activeUserSessions = get().activeUserSessions;
        const newActiveSessions = [...activeUserSessions, createdUserSession];

        set({ activeUserSessions: newActiveSessions });
        return createdUserSession;
    }),
    delete: action(set, async (id) => {
        await userSessionsService.delete(id);

        const activeUserSessions = get().activeUserSessions;
        const newActiveSessions = activeUserSessions.filter((nas) => nas.id !== id);

        set({ activeUserSessions: newActiveSessions });
        return id;
    }),
}));
