import { create } from 'zustand';
import { notificationsService } from '../../services';
import { action } from '../utilities';

export const useNotification = create((set, get) => ({
    // --- States ---
    notifications: [],
    activeNotification: null,
    unreadCount: 0,
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const notifications = await notificationsService.getAll();

        set({ notifications: notifications });
        return notifications;
    }),
    getById: action(set, async (id) => {
        const notification = await notificationsService.getById(id);
        return notification;
    }),
    getByRecipientId: action(set, async (recipientId) => {
        const notifications = await notificationsService.getByRecipientId(recipientId);
        const unreadCount = notifications.filter((uc) => !uc.is_read).length;

        set({
            notifications: notifications,
            unreadCount: unreadCount,
        });

        return notifications;
    }),
    getGroupedByRecipientId: action(set, async (recipientId) => {
        const notifications = await notificationsService.getGroupedByRecipientId(recipientId);
        const unreadCount = notifications.filter((uc) => !uc.is_read).length;

        set({
            notifications: notifications,
            unreadCount: unreadCount,
        });

        return notifications;
    }),

    // --- Locals ---
    selectActiveNotification: action(set, async (id) => {
        const notification = get().notifications.find((n) => n.id === id);
        const activeNotification = notification ?? (await notificationsService.getById(id));

        set({ activeNotification: activeNotification });
        return activeNotification;
    }),
    deselectActiveNotification: () => {
        set({ activeNotification: null });
    },

    // --- Actions ---
    update: action(set, async (id, data) => {
        const updatedNotificationResult = await notificationsService.update(id, data);

        const notifications = get().notifications;
        const newNotifications = notifications.map((nn) => {
            const isMatch = nn.id === id || (nn.notification_ids && nn.notification_ids.join(',') === id);
            if (isMatch) {
                // If it's a grouped notification (no id), we spread and apply the updated state manually.
                return nn.id ? updatedNotificationResult : { ...nn, ...data };
            }
            return nn;
        });
        const newUnreadCount = newNotifications.filter((nuc) => !nuc.is_read).length;

        const activeNotification = get().activeNotification;
        const newActiveNotification = activeNotification && (activeNotification.id === id || (activeNotification.notification_ids && activeNotification.notification_ids.join(',') === id)) 
            ? (activeNotification.id ? updatedNotificationResult : { ...activeNotification, ...data }) 
            : activeNotification;

        set({
            notifications: newNotifications,
            unreadCount: newUnreadCount,
            activeNotification: newActiveNotification,
        });

        return updatedNotificationResult;
    }),
    delete: action(set, async (id) => {
        await notificationsService.delete(id);

        const notifications = get().notifications;
        const newNotifications = notifications.filter((nn) => !(nn.id === id || (nn.notification_ids && nn.notification_ids.join(',') === id)));
        const newUnreadCount = newNotifications.filter((nuc) => !nuc.is_read).length;

        const activeNotification = get().activeNotification;
        const newActiveNotification = activeNotification && (activeNotification.id === id || (activeNotification.notification_ids && activeNotification.notification_ids.join(',') === id)) 
            ? null 
            : activeNotification;

        set({
            notifications: newNotifications,
            unreadCount: newUnreadCount,
            activeNotification: newActiveNotification,
        });

        return id;
    }),
}));
