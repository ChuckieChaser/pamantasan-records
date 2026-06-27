import { create } from 'zustand';
import { userSettingsService } from '../../services';
import { action } from '../utilities';

export const useUserSettings = create((set, get) => ({
    // --- States ---
    activeUserSetting: null,
    isLoading: false,
    error: null,

    // --- Locals ---
    selectActiveSetting: action(set, async (userId) => {
        const activeUserSetting = await userSettingsService.getByUserId(userId).catch(() => null);

        set({ activeUserSetting: activeUserSetting });
        return activeUserSetting;
    }),
    deselectActiveSetting: () => {
        set({ activeUserSetting: null });
    },

    // --- Actions ---
    create: action(set, async (userId) => {
        const createdSetting = await userSettingsService.create(userId);

        set({ activeUserSetting: createdSetting });
        return createdSetting;
    }),
    update: action(set, async (userId, data) => {
        const updatedSetting = await userSettingsService.update(userId, data);

        const activeUserSetting = get().activeUserSetting;
        const newActiveSetting = activeUserSetting?.user_id === userId ? updatedSetting : activeUserSetting;

        set({ activeUserSetting: newActiveSetting });
        return updatedSetting;
    }),
}));
