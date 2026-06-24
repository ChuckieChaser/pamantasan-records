import { auditLogsData } from '../data/audit_logs';

const DELAY_MS = 500;

// --- Audit Logs Service ---
export const mockAuditLogsService = {
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
                const auditLogs = auditLogsData.filter((auditLog) => auditLog.actor_id === actorId);
                resolve(auditLogs);
            }, DELAY_MS);
        });
    },
    getByEntityType: async (entityType) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const auditLogs = auditLogsData.filter((auditLog) => auditLog.entity_type === entityType);
                resolve(auditLogs);
            }, DELAY_MS);
        });
    },
    getByEntityId: async (entityId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const auditLogs = auditLogsData.filter((auditLog) => auditLog.entity_id === entityId);
                resolve(auditLogs);
            }, DELAY_MS);
        });
    },
};
