import { notificationsData, usersData, documentsData } from '../data';

const DELAY_MS = 500;

export const mockNotificationsService = {
    // --- Reads ---
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
                const notifications = notificationsData.filter((n) => n.recipient_id === recipientId);
                resolve(notifications);
            }, DELAY_MS);
        });
    },
    getGroupedByRecipientId: async (recipientId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const notifications = notificationsData.filter((n) => n.recipient_id === recipientId);
                const groupedNotificationsMap = notifications.reduce((accumulator, gnm) => {
                    const groupKey = `${gnm.entity_type}_${gnm.entity_id}_${gnm.action}`;

                    if (!accumulator[groupKey]) {
                        accumulator[groupKey] = { ...gnm, group_count: 1, actors: gnm.actor_id ? [gnm.actor_id] : [] };
                    } else {
                        accumulator[groupKey].group_count += 1;
                        if (gnm.actor_id && !accumulator[groupKey].actors.includes(gnm.actor_id)) {
                            accumulator[groupKey].actors.push(gnm.actor_id);
                        }
                        if (new Date(gnm.created_at) > new Date(accumulator[groupKey].created_at)) {
                            accumulator[groupKey].created_at = gnm.created_at;
                            accumulator[groupKey].is_read = accumulator[groupKey].is_read && gnm.is_read;
                        }
                    }

                    return accumulator;
                }, {});

                const groupedNotifications = Object.values(groupedNotificationsMap).map(notification => {
                    // Populate actor and entity name for rich notification display
                    const actor = usersData.find(u => u.id === notification.actors[0]);
                    const entity = documentsData.find(d => d.id === notification.entity_id);

                    return {
                        ...notification,
                        actor_name: actor ? `${actor.first_name} ${actor.last_name}` : 'Someone',
                        actor_avatar: actor ? actor.avatar_path : null,
                        entity_name: entity ? entity.name : 'a document'
                    };
                });
                resolve(groupedNotifications);
            }, DELAY_MS);
        });
    },

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const notification = {
                    id: crypto.randomUUID(),
                    ...data,
                    is_read: false,
                    is_emailed: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                notificationsData.push(notification);
                resolve(notification);
            }, DELAY_MS);
        });
    },
    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = notificationsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Notification not found'));

                notificationsData[index] = {
                    ...notificationsData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(notificationsData[index]);
            }, DELAY_MS);
        });
    },
    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = notificationsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Notification not found'));

                notificationsData.splice(index, 1);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};
