import { create } from 'zustand';
import { documentRequestMessagesService } from '../../services';
import { action } from '../utilities';

export const useDocumentRequestMessage = create((set, get) => ({
    // --- States ---
    documentRequestMessages: [],
    isLoading: false,
    error: null,

    // --- Reads ---
    getByDocumentRequestId: action(set, async (documentRequestId) => {
        const documentRequestMessages = await documentRequestMessagesService.getByDocumentRequestId(documentRequestId).catch(() => []);

        set({ documentRequestMessages: documentRequestMessages });
        return documentRequestMessages;
    }),

    // --- Actions ---
    create: action(set, async (data) => {
        const createdDocumentRequestMessage = await documentRequestMessagesService.create(data);

        const documentRequestMessages = get().documentRequestMessages;
        const newDocumentRequestMessages = [...documentRequestMessages, createdDocumentRequestMessage];

        set({ documentRequestMessages: newDocumentRequestMessages });
        return createdDocumentRequestMessage;
    }),
}));
