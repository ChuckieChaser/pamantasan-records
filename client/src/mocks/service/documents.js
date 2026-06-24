import { documentsData, documentVersionsData, documentRequestsData, documentRequestMessagesData, documentSharesData } from '../data';

const DELAY_MS = 500;

// --- Documents Service ---
export const mockDocumentsService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documents = [...documentsData];
                resolve(documents);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const document = documentsData.find((d) => d.id === id);
                document ? resolve({ ...document }) : reject(new Error('Document not found'));
            }, DELAY_MS);
        });
    },
    getByUploaderId: async (uploaderId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documents = documentsData.filter((document) => document.uploader_id === uploaderId);
                resolve(documents);
            }, DELAY_MS);
        });
    },
};

// --- Document Versions Service ---
export const mockDocumentVersionsService = {
    getByDocumentId: async (documentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentVersions = documentVersionsData.filter((documentVersion) => documentVersion.document_id === documentId);
                resolve(documentVersions);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const documentVersion = documentVersionsData.find((dv) => dv.id === id);
                documentVersion ? resolve({ ...documentVersion }) : reject(new Error('Document version not found'));
            }, DELAY_MS);
        });
    },
};

// --- Document Requests Service ---
export const mockDocumentRequestsService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentRequests = [...documentRequestsData];
                resolve(documentRequests);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const documentRequest = documentRequestsData.find((dr) => dr.id === id);
                documentRequest ? resolve({ ...documentRequest }) : reject(new Error('Document request not found'));
            }, DELAY_MS);
        });
    },
    getByRequesterId: async (requesterId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentRequests = documentRequestsData.filter((documentRequest) => documentRequest.requester_id === requesterId);
                resolve(documentRequests);
            }, DELAY_MS);
        });
    },
};

// --- Document Request Messages Service ---
export const mockDocumentRequestMessagesService = {
    getByDocumentRequestId: async (documentRequestId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentRequestMessages = documentRequestMessagesData.filter((documentRequestMessage) => documentRequestMessage.document_request_id === documentRequestId);
                resolve(documentRequestMessages);
            }, DELAY_MS);
        });
    },
};

// --- Document Shares Service ---
export const mockDocumentSharesService = {
    getByDocumentId: async (documentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentShares = documentSharesData.filter((documentShare) => documentShare.document_id === documentId);
                resolve(documentShares);
            }, DELAY_MS);
        });
    },
    getByDepartmentId: async (departmentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentShares = documentSharesData.filter((documentShare) => documentShare.department_id === departmentId);
                resolve(documentShares);
            }, DELAY_MS);
        });
    },
};
