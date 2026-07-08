import { create } from 'zustand';

// ==============================================================================
// DOCUMENT VIEWER STORE
// Manages the global state for the document viewing modal.
// This allows any component (like double-clicking a document card) to open
// the file previewer without relying on the Inspector's local state.
// ==============================================================================

export const useDocumentViewer = create((set) => ({
    isOpen: false,
    document: null,

    openViewer: (document) => set({ isOpen: true, document }),
    closeViewer: () => set({ isOpen: false, document: null }),
}));
