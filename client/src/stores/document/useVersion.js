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
    create: action(set, async (documentId, form) => {
        const createdDocumentVersion = await documentVersionsService.create(documentId, form);

        const documentVersions = get().documentVersions;
        const newDocumentVersions = [...documentVersions, createdDocumentVersion];

        set({ documentVersions: newDocumentVersions });
        return createdDocumentVersion;
    }),
    revert: async (docId, versionId, uploaderId) => {
        set({ isLoading: true, error: null });
        try {
            const newVersion = await documentVersionsService.revert(docId, { version_id: versionId, uploader_id: uploaderId });
            set({ documentVersions: [...get().documentVersions, newVersion], isLoading: false });
            return newVersion;
        } catch (error) {
            set({ error: error.response?.data?.error || error.message, isLoading: false });
            throw error;
        }
    },
    update: action(set, async (id, data) => {
        const updatedDocumentVersion = await documentVersionsService.update(id, data);

        const documentVersions = get().documentVersions;
        const newDocumentVersions = documentVersions.map((dv) => (dv.id === id ? updatedDocumentVersion : dv));

        set({ documentVersions: newDocumentVersions });
        return updatedDocumentVersion;
    }),
}));
