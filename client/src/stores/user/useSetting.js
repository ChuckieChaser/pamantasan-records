import { create } from 'zustand';
import { userSettingsService } from '../../services';
import { action } from '../utilities';

export const useUserSetting = create((set, get) => ({
    // --- States ---
    activeUserSetting: null,
    isLoading: false,
    error: null,

    // --- Locals ---
    selectActiveUserSetting: action(set, async (userId) => {
        const activeUserSetting = await userSettingsService.getByUserId(userId).catch(() => null);

        set({ activeUserSetting: activeUserSetting });
        return activeUserSetting;
    }),
    deselectActiveUserSetting: () => {
        set({ activeUserSetting: null });
    },

    // --- Actions ---
    create: action(set, async (userId) => {
        const createdUserSetting = await userSettingsService.create(userId);

        set({ activeUserSetting: createdUserSetting });
        return createdUserSetting;
    }),
    update: action(set, async (userId, data) => {
        const updatedUserSetting = await userSettingsService.update(userId, data);

        const activeUserSetting = get().activeUserSetting;
        const newActiveUserSetting = activeUserSetting?.user_id === userId ? updatedUserSetting : activeUserSetting;

        set({ activeUserSetting: newActiveUserSetting });
        return updatedUserSetting;
    }),
}));
