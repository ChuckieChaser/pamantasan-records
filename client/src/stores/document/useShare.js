import { create } from 'zustand';
import { documentSharesService } from '../../services';
import { action } from '../utilities';

export const useDocumentShare = create((set, get) => ({
    // --- States ---
    documentShares: [],
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const documentShares = await documentSharesService.getAll().catch(() => []);

        set({ documentShares: documentShares });
        return documentShares;
    }),
    getByDocumentId: action(set, async (documentId) => {
        const documentShares = await documentSharesService.getByDocumentId(documentId).catch(() => []);

        set({ documentShares: documentShares });
        return documentShares;
    }),
    getByDepartmentId: action(set, async (departmentId) => {
        const documentShares = await documentSharesService.getByDepartmentId(departmentId).catch(() => []);

        set({ documentShares: documentShares });
        return documentShares;
    }),

    // --- Actions ---
    create: action(set, async (data) => {
        const createdDocumentShare = await documentSharesService.create(data);

        await get().getAll();

        return createdDocumentShare;
    }),
    update: action(set, async (id, data) => {
        const updatedDocumentShare = await documentSharesService.update(id, data);

        await get().getAll();

        return updatedDocumentShare;
    }),
    delete: action(set, async (id) => {
        await documentSharesService.delete(id);

        await get().getAll();

        return id;
    }),
}));
