import { auditLogsData, ADMINISTRATOR_ID } from '../data';

const DELAY_MS = 500;

export const logAudit = (entityType, entityId, action, data = null) => {
    const auditLog = {
        id: crypto.randomUUID(),
        actor_id: ADMINISTRATOR_ID, // Defaulting to admin for mock automated logs
        entity_type: entityType,
        entity_id: entityId,
        action: action,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
        created_at: new Date().toISOString(),
    };
    auditLogsData.push(auditLog);
};

export const mockAuditLogsService = {
    // --- Reads ---
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const auditLogs = [...auditLogsData];
                resolve(auditLogs);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const auditLog = auditLogsData.find((al) => al.id === id);
                auditLog ? resolve({ ...auditLog }) : reject(new Error('Audit log not found'));
            }, DELAY_MS);
        });
    },
    getByActorId: async (actorId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const auditLogs = auditLogsData.filter((al) => al.actor_id === actorId);
                resolve(auditLogs);
            }, DELAY_MS);
        });
    },
    getByEntityType: async (entityType) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const auditLogs = auditLogsData.filter((al) => al.entity_type === entityType);
                resolve(auditLogs);
            }, DELAY_MS);
        });
    },
    getByEntityId: async (entityId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const auditLogs = auditLogsData.filter((al) => al.entity_id === entityId);
                resolve(auditLogs);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const auditLog = {
                    id: crypto.randomUUID(),
                    ...data,
                    created_at: new Date().toISOString(),
                };

                auditLogsData.push(auditLog);
                resolve(auditLog);
            }, DELAY_MS);
        });
    },
};
