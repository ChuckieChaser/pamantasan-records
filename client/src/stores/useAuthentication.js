import { create } from 'zustand';
import { USER_SETTINGS_THEME } from '../constants';
import { mockUsersService } from '../mocks/service';
import { ADMINISTRATOR_ID, userSettingsData } from '../mocks/data';

export const useAuthentication = create((set) => ({
    user: null,
    theme: USER_SETTINGS_THEME.LIGHT,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    initialize: async () => {
        set({ isLoading: true, error: null });
        try {
            const user = await mockUsersService.getById(ADMINISTRATOR_ID);
            const userSetting = userSettingsData.find((us) => us.user_id === user.id);

            set({ user: user, theme: userSetting?.theme || USER_SETTINGS_THEME.LIGHT, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false, error: error.message });
        }
    },

    login: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const user = await mockUsersService.getById(userId);
            set({ user: user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false, error: error.message });
        }
    },

    logout: () => {
        set({ user: null, isAuthenticated: false });
    },
}));
