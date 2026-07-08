import { create } from 'zustand';
import { documentVersionsService } from '../../services';
import { action } from '../utilities';

export const useDocumentVersion = create((set, get) => ({
    // --- States ---
    documentVersions: [],
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const documentVersions = await documentVersionsService.getAll();

        set({ documentVersions: documentVersions });
        return documentVersions;
    }),
    getByDocumentId: action(set, async (documentId) => {
        const documentVersions = await documentVersionsService.getByDocumentId(documentId).catch(() => []);

        set({ documentVersions: documentVersions });
        return documentVersions;
    }),

    // --- Actions ---
    create: action(set, async (data) => {
        const createdDocumentVersion = await documentVersionsService.create(data);

        const documentVersions = get().documentVersions;
        const newDocumentVersions = [...documentVersions, createdDocumentVersion];

        set({ documentVersions: newDocumentVersions });
        return createdDocumentVersion;
    }),
    update: action(set, async (id, data) => {
        const updatedDocumentVersion = await documentVersionsService.update(id, data);

        const documentVersions = get().documentVersions;
        const newDocumentVersions = documentVersions.map((dv) => (dv.id === id ? updatedDocumentVersion : dv));

        set({ documentVersions: newDocumentVersions });
        return updatedDocumentVersion;
    }),
}));
