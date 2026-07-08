import { coordinatorRequestsData, usersData } from '../data';
import { COORDINATOR_REQUESTS_STATUS, AUDIT_LOGS_ENTITY_TYPE, AUDIT_LOGS_ACTION, COORDINATOR_REQUESTS_ACTION, USERS_STATUS } from '../../constants';
import { logAudit } from './audits';

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
                logAudit(AUDIT_LOGS_ENTITY_TYPE.COORDINATOR_REQUEST, coordinatorRequest.id, AUDIT_LOGS_ACTION.CREATED, coordinatorRequest);
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

                let action = AUDIT_LOGS_ACTION.UPDATED;
                if (data.status) {
                    if (data.status === COORDINATOR_REQUESTS_STATUS.APPROVED) {
                        action = AUDIT_LOGS_ACTION.APPROVED;
                        // Execute side-effect of approval
                        const request = coordinatorRequestsData[index];
                        if (request.action === COORDINATOR_REQUESTS_ACTION.USER_SUSPEND) {
                            const userIndex = usersData.findIndex(u => u.id === request.data.user_id);
                            if (userIndex !== -1) {
                                usersData[userIndex].status = USERS_STATUS.SUSPENDED;
                                usersData[userIndex].updated_at = new Date().toISOString();
                                logAudit(AUDIT_LOGS_ENTITY_TYPE.USER, usersData[userIndex].id, AUDIT_LOGS_ACTION.SUSPENDED, usersData[userIndex]);
                            }
                        }
                        // Other actions (USER_CREATE, DEPARTMENT_CREATE) can be added here
                    } else if (data.status === COORDINATOR_REQUESTS_STATUS.REJECTED) {
                        action = AUDIT_LOGS_ACTION.REJECTED;
                    }
                }

                logAudit(AUDIT_LOGS_ENTITY_TYPE.COORDINATOR_REQUEST, id, action, data);

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
                logAudit(AUDIT_LOGS_ENTITY_TYPE.COORDINATOR_REQUEST, id, AUDIT_LOGS_ACTION.DELETED);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};
