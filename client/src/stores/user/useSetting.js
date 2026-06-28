import { create } from 'zustand';
import { userSettingsService } from '../../services';
import { action } from '../utilities';

export const useUserSetting = create((set, get) => ({
    // --- States ---
    userSetting: null,
    isLoading: false,
    error: null,

    // --- Reads ---
    getByUserId: action(set, async (userId) => {
        const userSetting = await userSettingsService.getByUserId(userId).catch(() => null);

        set({ userSetting: userSetting });
        return userSetting;
    }),

    // --- Actions ---
    create: action(set, async (userId) => {
        const createdUserSetting = await userSettingsService.create(userId);

        set({ userSetting: createdUserSetting });
        return createdUserSetting;
    }),
    update: action(set, async (userId, data) => {
        const updatedUserSetting = await userSettingsService.update(userId, data);

        const userSetting = get().userSetting;
        const newUserSetting = userSetting?.user_id === userId ? updatedUserSetting : userSetting;

        set({ userSetting: newUserSetting });
        return updatedUserSetting;
    }),
}));
