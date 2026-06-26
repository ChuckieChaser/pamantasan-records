import { coordinatorRequestsData } from '../data';
import { COORDINATOR_REQUESTS_STATUS } from '../../constants';

const DELAY_MS = 500;

export const mockCoordinatorRequestsService = {
    // --- Reads ---
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const coordinatorRequests = [...coordinatorRequestsData];
                resolve(coordinatorRequests);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const coordinatorRequest = coordinatorRequestsData.find((cr) => cr.id === id);
                coordinatorRequest ? resolve({ ...coordinatorRequest }) : reject(new Error('Coordinator request not found'));
            }, DELAY_MS);
        });
    },
    getByRequesterId: async (requesterId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const coordinatorRequests = coordinatorRequestsData.filter((cr) => cr.requester_id === requesterId);
                resolve(coordinatorRequests);
            }, DELAY_MS);
        });
    },
    getByReviewerId: async (reviewerId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const coordinatorRequests = coordinatorRequestsData.filter((cr) => cr.reviewer_id === reviewerId);
                resolve(coordinatorRequests);
            }, DELAY_MS);
        });
    },
    getByStatus: async (status) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const coordinatorRequests = coordinatorRequestsData.filter((cr) => cr.status === status);
                resolve(coordinatorRequests);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const coordinatorRequest = {
                    id: crypto.randomUUID(),
                    ...data,
                    status: COORDINATOR_REQUESTS_STATUS.PENDING,
                    rejection_reason: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                coordinatorRequestsData.push(coordinatorRequest);
                resolve(coordinatorRequest);
            }, DELAY_MS);
        });
    },
    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = coordinatorRequestsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Coordinator request not found'));

                coordinatorRequestsData[index] = {
                    ...coordinatorRequestsData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(coordinatorRequestsData[index]);
            }, DELAY_MS);
        });
    },
    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = coordinatorRequestsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Coordinator request not found'));

                coordinatorRequestsData.splice(index, 1);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};
