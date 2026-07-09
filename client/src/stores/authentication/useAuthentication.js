import { create } from 'zustand';
import { USER_SETTINGS_THEME } from '../../constants';
import { apiClient } from '../../services/api/axios';
import { action } from '../utilities';

// ==============================================================================
// AUTHENTICATION STORE
// Manages the current user session. On login, the user object is persisted to
// localStorage so the axios interceptor can attach user context headers.
// No JWT — the server trusts the headers and enforces RLS per request.
// ==============================================================================

export const useAuthentication = create((set) => ({
    // --- States ---
    user: null,
    settings: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // --- Actions ---
    login: action(set, async (university_id, password) => {
        const response = await apiClient.post('/auth/login', { university_id, password });
        const { user, settings } = response.data;

        // Persist user context for the axios interceptor
        localStorage.setItem('pamantasan_user', JSON.stringify(user));

        set({
            user,
            settings,
            isAuthenticated: true,
        });

        return user;
    }),

    // Restore session from localStorage on page refresh
    restore: action(set, async () => {
        const raw = localStorage.getItem('pamantasan_user');
        if (!raw) return null;

        const cached = JSON.parse(raw);
        const response = await apiClient.get('/auth/me');
        const { user, settings } = response.data;

        // Update the cached copy in case it changed
        localStorage.setItem('pamantasan_user', JSON.stringify(user));

        set({ user, settings, isAuthenticated: true });
        return user;
    }),

    updateUser: (updatedUser) => set((state) => {
        if (!state.user) return state;
        const newUser = { ...state.user, ...updatedUser };
        localStorage.setItem('pamantasan_user', JSON.stringify(newUser));
        return { user: newUser };
    }),

    logout: () => {
        localStorage.removeItem('pamantasan_user');
        set({
            user: null,
            settings: null,
            isAuthenticated: false,
            error: null,
        });
    },
}));
