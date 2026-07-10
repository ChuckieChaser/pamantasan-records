import { create } from 'zustand';
import { documentVersionsService } from '../../services';
import { action } from '../utilities';
import { useDocument } from './useDocument';

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
        const fetchedVersions = await documentVersionsService.getByDocumentId(documentId).catch(() => []);

        set(state => {
            const others = state.documentVersions.filter(v => v.document_id !== documentId);
            return { documentVersions: [...others, ...fetchedVersions] };
        });
        return fetchedVersions;
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
            const targetVersion = await documentVersionsService.revert(docId, { version_id: versionId, uploader_id: uploaderId });
            
            const currentVersions = get().documentVersions;
            const newVersions = currentVersions.filter(v => v.document_id !== docId || v.version <= targetVersion.version);
            
            set({ documentVersions: newVersions, isLoading: false });
            
            // Sync up the document store
            useDocument.getState().getAll();
            
            return targetVersion;
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
