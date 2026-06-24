import { notificationsData } from '../data/notifications';

const DELAY_MS = 500;

export const mockNotificationsService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const notifications = [...notificationsData];
                resolve(notifications);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const notification = notificationsData.find((n) => n.id === id);
                notification ? resolve({ ...notification }) : reject(new Error('Notification not found'));
            }, DELAY_MS);
        });
    },
    getByRecipientId: async (recipientId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const notifications = notificationsData.filter((notification) => notification.recipient_id === recipientId);
                resolve(notifications);
            }, DELAY_MS);
        });
    },
    getGroupedByRecipientId: async (recipientId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const notifications = notificationsData.filter((notification) => notification.recipient_id === recipientId);
                const groupedNotificationsMap = notifications.reduce((accumulator, notification) => {
                    const groupKey = `${notification.entity_type}_${notification.entity_id}_${notification.action}`;

                    if (!accumulator[groupKey]) {
                        accumulator[groupKey] = {
                            ...notification,
                            group_count: 1,
                            actors: notification.actor_id ? [notification.actor_id] : [],
                        };
                    } else {
                        accumulator[groupKey].group_count += 1;
                        if (notification.actor_id && !accumulator[groupKey].actors.includes(notification.actor_id)) {
                            accumulator[groupKey].actors.push(notification.actor_id);
                        }
                        // Update to the latest timestamp in the group
                        if (new Date(notification.created_at) > new Date(accumulator[groupKey].created_at)) {
                            accumulator[groupKey].created_at = notification.created_at;
                            accumulator[groupKey].is_read = accumulator[groupKey].is_read && notification.is_read;
                        }
                    }

                    return accumulator;
                }, {});

                resolve(Object.values(groupedNotificationsMap));
            }, DELAY_MS);
        });
    },
};
