import { create } from 'zustand';
import { userCredentialsService } from '../../services';
import { action } from '../utilities';

export const useUserCredentials = create((set) => ({
    // --- States ---
    isLoading: false,
    error: null,

    // --- Actions ---
    create: action(set, async (data) => {
        const createdCredential = await userCredentialsService.create(data);
        return createdCredential;
    }),
    update: action(set, async (userId, data) => {
        const updatedCredential = await userCredentialsService.update(userId, data);
        return updatedCredential;
    }),
}));
