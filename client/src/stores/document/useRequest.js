import { create } from 'zustand';
import { documentRequestsService } from '../../services';
import { action } from '../utilities';

export const useDocumentRequest = create((set, get) => ({
    // --- States ---
    documentRequests: [],
    activeDocumentRequest: null,
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const documentRequests = await documentRequestsService.getAll();

        const activeId = get().activeDocumentRequest?.id;
        const newActive = activeId ? documentRequests.find(r => r.id === activeId) || null : null;

        set({ documentRequests: documentRequests, ...(activeId && { activeDocumentRequest: newActive }) });
        return documentRequests;
    }),
    getById: action(set, async (id) => {
        const documentRequest = await documentRequestsService.getById(id);
        return documentRequest;
    }),
    getByRequesterId: action(set, async (requesterId) => {
        const documentRequests = await documentRequestsService.getByRequesterId(requesterId);

        set({ documentRequests: documentRequests });
        return documentRequests;
    }),

    // --- Locals ---
    selectActiveDocumentRequest: action(set, async (id) => {
        const documentRequest = get().documentRequests.find((dr) => dr.id === id);
        const activeDocumentRequest = documentRequest ?? (await documentRequestsService.getById(id));

        set({ activeDocumentRequest: activeDocumentRequest });
        return activeDocumentRequest;
    }),
    deselectActiveDocumentRequest: () => {
        set({ activeDocumentRequest: null });
    },

    // --- Actions ---
    create: action(set, async (data) => {
        const createdDocumentRequest = await documentRequestsService.create(data);

        const documentRequests = get().documentRequests;
        const newDocumentRequests = [...documentRequests, createdDocumentRequest];

        set({ documentRequests: newDocumentRequests });
        return createdDocumentRequest;
    }),
    update: action(set, async (id, data) => {
        const updatedDocumentRequest = await documentRequestsService.update(id, data);

        const documentRequests = get().documentRequests;
        const newDocumentRequests = documentRequests.map((ndr) => (ndr.id === id ? updatedDocumentRequest : ndr));

        const activeDocumentRequest = get().activeDocumentRequest;
        const newActiveDocumentRequest = activeDocumentRequest?.id === id ? updatedDocumentRequest : activeDocumentRequest;

        set({
            documentRequests: newDocumentRequests,
            activeDocumentRequest: newActiveDocumentRequest,
        });

        return updatedDocumentRequest;
    }),
    delete: action(set, async (id) => {
        await documentRequestsService.delete(id);

        const documentRequests = get().documentRequests;
        const newDocumentRequests = documentRequests.filter((ndr) => ndr.id !== id);

        const activeDocumentRequest = get().activeDocumentRequest;
        const newActiveDocumentRequest = activeDocumentRequest?.id === id ? null : activeDocumentRequest;

        set({
            documentRequests: newDocumentRequests,
            activeDocumentRequest: newActiveDocumentRequest,
        });

        return id;
    }),
}));
