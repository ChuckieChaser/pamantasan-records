import { create } from 'zustand';
import { documentRequestAttachmentsService } from '../../services';
import { action } from '../utilities';

export const useAttachment = create((set, get) => ({
    // --- States ---
    attachments: [],
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const attachments = await documentRequestAttachmentsService.getAll().catch(() => []);

        set({ attachments: attachments });
        return attachments;
    }),

    // --- Actions ---
    create: action(set, async (data) => {
        const createdAttachment = await documentRequestAttachmentsService.create(data);

        const attachments = get().attachments;
        const newAttachments = [...attachments, createdAttachment];

        set({ attachments: newAttachments });
        return createdAttachment;
    }),
    delete: action(set, async (id) => {
        await documentRequestAttachmentsService.delete(id);

        const attachments = get().attachments;
        const newAttachments = attachments.filter((nda) => nda.id !== id);

        set({ attachments: newAttachments });
        return id;
    }),
}));
