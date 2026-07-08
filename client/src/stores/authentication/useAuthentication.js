import { create } from 'zustand';
import { USER_SETTINGS_THEME } from '../../constants';
import { usersService, userSettingsService } from '../../services';
import { action } from '../utilities';

export const useAuthentication = create((set) => ({
    // --- States ---
    user: null,
    theme: USER_SETTINGS_THEME.SYSTEM,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // --- Actions ---
    login: action(set, async (userId) => {
        const user = await usersService.getById(userId);

        const userSetting = await userSettingsService.getByUserId(user.id).catch(() => null);
        const theme = userSetting?.theme ?? USER_SETTINGS_THEME.SYSTEM;

        set({
            user: user,
            theme: theme,
            isAuthenticated: true,
        });

        return user;
    }),
    logout: () => {
        set({
            user: null,
            isAuthenticated: false,
            theme: USER_SETTINGS_THEME.SYSTEM,
            error: null,
        });
    },
}));
