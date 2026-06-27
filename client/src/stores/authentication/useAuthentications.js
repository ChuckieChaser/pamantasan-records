import { create } from 'zustand';
import { USER_SETTINGS_THEME } from '../../constants';
import { usersService, userSettingsService } from '../../services';
import { ADMINISTRATOR_ID } from '../../mocks/data';
import { action } from '../utilities';

export const useAuthentications = create((set) => ({
    // --- States ---
    user: null,
    theme: USER_SETTINGS_THEME.SYSTEM,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    // --- Actions ---
    bypass: action(set, async () => {
        const user = await usersService.getById(ADMINISTRATOR_ID);

        const userSetting = await userSettingsService.getByUserId(user.id).catch(() => null);
        const theme = userSetting?.theme ?? USER_SETTINGS_THEME.SYSTEM;

        set({
            user: user,
            theme: theme,
            isAuthenticated: true,
        });

        return user;
    }),
    login: action(set, async (universityId) => {
        const user = await usersService.getByUniversityId(universityId);

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
