import { create } from 'zustand';
import { userCredentialsService } from '../../services';
import { action } from '../utilities';

export const useUserCredential = create((set) => ({
    // --- States ---
    isLoading: false,
    error: null,

    // --- Actions ---
    create: action(set, async (data) => {
        const createdUserCredential = await userCredentialsService.create(data);
        return createdUserCredential;
    }),
    update: action(set, async (userId, data) => {
        const updatedUserCredential = await userCredentialsService.update(userId, data);
        return updatedUserCredential;
    }),
}));
