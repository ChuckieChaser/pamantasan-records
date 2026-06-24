import { coordinatorRequestsData } from '../data/coordinators';

const DELAY_MS = 500;

// --- Coordinator Requests Service ---
export const mockCoordinatorRequestsService = {
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
                const coordinatorRequests = coordinatorRequestsData.filter((coordinatorRequest) => coordinatorRequest.requester_id === requesterId);
                resolve(coordinatorRequests);
            }, DELAY_MS);
        });
    },
    getByReviewerId: async (reviewerId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const coordinatorRequests = coordinatorRequestsData.filter((coordinatorRequest) => coordinatorRequest.reviewer_id === reviewerId);
                resolve(coordinatorRequests);
            }, DELAY_MS);
        });
    },
    getByStatus: async (status) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const coordinatorRequests = coordinatorRequestsData.filter((coordinatorRequest) => coordinatorRequest.status === status);
                resolve(coordinatorRequests);
            }, DELAY_MS);
        });
    },
};
