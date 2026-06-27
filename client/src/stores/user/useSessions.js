import { create } from 'zustand';
import { userSessionsService } from '../../services';
import { action } from '../utilities';

export const useUserSessions = create((set, get) => ({
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
        const createdSession = await userSessionsService.create(data);

        const activeUserSessions = get().activeUserSessions;
        const newActiveSessions = [...activeUserSessions, createdSession];

        set({ activeUserSessions: newActiveSessions });
        return createdSession;
    }),
    delete: action(set, async (sessionId) => {
        await userSessionsService.delete(sessionId);

        const activeUserSessions = get().activeUserSessions;
        const newActiveSessions = activeUserSessions.filter((s) => s.id !== sessionId);

        set({ activeUserSessions: newActiveSessions });
        return sessionId;
    }),
}));
