import { documentsData, documentVersionsData, documentRequestsData, documentRequestMessagesData, documentSharesData } from '../data';
import { DOCUMENTS_STATUS, DOCUMENT_REQUESTS_STATUS } from '../../constants';

const DELAY_MS = 500;

export const mockDocumentsService = {
    // --- Reads ---
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
                const documents = documentsData.filter((d) => d.uploader_id === uploaderId);
                resolve(documents);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const document = {
                    id: crypto.randomUUID(),
                    ...data,
                    status: DOCUMENTS_STATUS.UPLOADED,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                documentsData.push(document);
                resolve(document);
            }, DELAY_MS);
        });
    },
    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = documentsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Document not found'));

                documentsData[index] = {
                    ...documentsData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(documentsData[index]);
            }, DELAY_MS);
        });
    },
    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = documentsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Document not found'));

                documentsData.splice(index, 1);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};

export const mockDocumentVersionsService = {
    // --- Reads ---
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentVersions = [...documentVersionsData];
                resolve(documentVersions);
            }, DELAY_MS);
        });
    },
    getByDocumentId: async (documentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentVersions = documentVersionsData.filter((dv) => dv.document_id === documentId);
                resolve(documentVersions);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentVersion = {
                    id: crypto.randomUUID(),
                    ...data,
                    created_at: new Date().toISOString(),
                    rejected_at: null,
                };

                documentVersionsData.push(documentVersion);
                resolve(documentVersion);
            }, DELAY_MS);
        });
    },
};

export const mockDocumentRequestsService = {
    // --- Reads ---
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
                const documentRequests = documentRequestsData.filter((dr) => dr.requester_id === requesterId);
                resolve(documentRequests);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentRequest = {
                    id: crypto.randomUUID(),
                    ...data,
                    status: DOCUMENT_REQUESTS_STATUS.OPEN,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                documentRequestsData.push(documentRequest);
                resolve(documentRequest);
            }, DELAY_MS);
        });
    },
    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = documentRequestsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Document request not found'));

                documentRequestsData[index] = {
                    ...documentRequestsData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(documentRequestsData[index]);
            }, DELAY_MS);
        });
    },
    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = documentRequestsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Document request not found'));

                documentRequestsData.splice(index, 1);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};

export const mockDocumentRequestMessagesService = {
    // --- Reads ---
    getByDocumentRequestId: async (documentRequestId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentRequestMessages = documentRequestMessagesData.filter((drm) => drm.document_request_id === documentRequestId);
                resolve(documentRequestMessages);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentRequestMessage = {
                    id: crypto.randomUUID(),
                    ...data,
                    created_at: new Date().toISOString(),
                };

                documentRequestMessagesData.push(documentRequestMessage);
                resolve(documentRequestMessage);
            }, DELAY_MS);
        });
    },
};

export const mockDocumentSharesService = {
    // --- Reads ---
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentShares = [...documentSharesData];
                resolve(documentShares);
            }, DELAY_MS);
        });
    },
    getByDocumentId: async (documentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentShares = documentSharesData.filter((ds) => ds.document_id === documentId);
                resolve(documentShares);
            }, DELAY_MS);
        });
    },
    getByDepartmentId: async (departmentId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentShares = documentSharesData.filter((ds) => ds.department_id === departmentId);
                resolve(documentShares);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const documentShare = {
                    id: crypto.randomUUID(),
                    ...data,
                    created_at: new Date().toISOString(),
                };

                documentSharesData.push(documentShare);
                resolve(documentShare);
            }, DELAY_MS);
        });
    },
    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = documentSharesData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Document share not found'));

                documentSharesData[index] = {
                    ...documentSharesData[index],
                    ...data,
                };

                resolve(documentSharesData[index]);
            }, DELAY_MS);
        });
    },
    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = documentSharesData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Document share not found'));

                documentSharesData.splice(index, 1);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};
