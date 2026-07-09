import { create } from 'zustand';
import { documentsService } from '../../services';
import { action } from '../utilities';

export const useDocument = create((set, get) => ({
    // --- States ---
    documents: [],
    activeDocument: null,
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const documents = await documentsService.getAll();

        set({ documents: documents });
        return documents;
    }),
    getById: action(set, async (id) => {
        const document = await documentsService.getById(id);
        return document;
    }),
    getByUploaderId: action(set, async (uploaderId) => {
        const documents = await documentsService.getByUploaderId(uploaderId);

        set({ documents: documents });
        return documents;
    }),

    // --- Locals ---
    selectActiveDocument: action(set, async (id) => {
        const document = get().documents.find((d) => d.id === id);
        const activeDocument = document ?? (await documentsService.getById(id));

        set({ activeDocument: activeDocument });
        return activeDocument;
    }),
    deselectActiveDocument: () => {
        set({ activeDocument: null });
    },

    // --- Actions ---
    create: action(set, async (data) => {
        const createdDocument = await documentsService.create(data);

        const documents = get().documents;
        const newDocuments = [...documents, createdDocument];

        set({ documents: newDocuments });
        return createdDocument;
    }),
    update: action(set, async (id, data) => {
        const updatedDocument = await documentsService.update(id, data);

        const documents = get().documents;
        const newDocuments = documents.map((nd) => (nd.id === id ? updatedDocument : nd));

        const activeDocument = get().activeDocument;
        const newActiveDocument = activeDocument?.id === id ? updatedDocument : activeDocument;

        set({
            documents: newDocuments,
            activeDocument: newActiveDocument,
        });

        return updatedDocument;
    }),
    delete: action(set, async (id) => {
        await documentsService.delete(id);

        // Resynchronize the entire tree from the backend to ensure cascading deletes (like archived children) are removed from the store
        await get().getAll();

        const activeDocument = get().activeDocument;
        const newActiveDocument = activeDocument?.id === id ? null : activeDocument;

        set({
            activeDocument: newActiveDocument,
        });

        return id;
    }),
}));
