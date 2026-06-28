import { create } from 'zustand';
import { documentSharesService } from '../../services';
import { action } from '../utilities';

export const useDocumentShare = create((set, get) => ({
    // --- States ---
    documentShares: [],
    isLoading: false,
    error: null,

    // --- Reads ---
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

        const documentShares = get().documentShares;
        const newDocumentShares = [...documentShares, createdDocumentShare];

        set({ documentShares: newDocumentShares });
        return createdDocumentShare;
    }),
    update: action(set, async (id, data) => {
        const updatedDocumentShare = await documentSharesService.update(id, data);

        const documentShares = get().documentShares;
        const newDocumentShares = documentShares.map((nds) => (nds.id === id ? updatedDocumentShare : nds));

        set({ documentShares: newDocumentShares });
        return updatedDocumentShare;
    }),
    delete: action(set, async (id) => {
        await documentSharesService.delete(id);

        const documentShares = get().documentShares;
        const newDocumentShares = documentShares.filter((nds) => nds.id !== id);

        set({ documentShares: newDocumentShares });
        return id;
    }),
}));
