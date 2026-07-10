import { create } from 'zustand';
import { auditLogsService } from '../../services';
import { action } from '../utilities';

export const useAuditLog = create((set, get) => ({
    // --- States ---
    auditLogs: [],
    activeAuditLog: null,
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const auditLogs = await auditLogsService.getAll();

        const activeId = get().activeAuditLog?.id;
        const newActive = activeId ? auditLogs.find(a => a.id === activeId) || null : null;

        set({ auditLogs: auditLogs, ...(activeId && { activeAuditLog: newActive }) });
        return auditLogs;
    }),
    getById: action(set, async (id) => {
        const auditLog = await auditLogsService.getById(id);
        return auditLog;
    }),
    getByActorId: action(set, async (actorId) => {
        const auditLogs = await auditLogsService.getByActorId(actorId);

        set({ auditLogs: auditLogs });
        return auditLogs;
    }),
    getByEntityType: action(set, async (entityType) => {
        const auditLogs = await auditLogsService.getByEntityType(entityType);

        set({ auditLogs: auditLogs });
        return auditLogs;
    }),
    getByEntityId: action(set, async (entityId) => {
        const auditLogs = await auditLogsService.getByEntityId(entityId);

        set({ auditLogs: auditLogs });
        return auditLogs;
    }),

    // --- Locals ---
    selectActiveAuditLog: action(set, async (id) => {
        const auditLog = get().auditLogs.find((al) => al.id === id);
        const activeAuditLog = auditLog ?? (await auditLogsService.getById(id));

        set({ activeAuditLog: activeAuditLog });
        return activeAuditLog;
    }),
    deselectActiveAuditLog: () => {
        set({ activeAuditLog: null });
    },

    // --- Actions ---
    create: action(set, async (data) => {
        const createdAuditLog = await auditLogsService.create(data);

        const auditLogs = get().auditLogs;
        const newAuditLogs = [...auditLogs, createdAuditLog];

        set({ auditLogs: newAuditLogs });
        return createdAuditLog;
    }),
}));
