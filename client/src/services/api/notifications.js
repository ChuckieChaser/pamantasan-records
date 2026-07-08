import { apiClient } from './axios';

export const notificationsApi = {
    getAll:             (params = {})    => apiClient.get('/notifications', { params }).then(r => r.data),
    getById:            (id)             => apiClient.get(`/notifications/${id}`).then(r => r.data),
    getByRecipientId:   (rid)            => apiClient.get('/notifications', { params: { recipient_id: rid } }).then(r => r.data),
    getGroupedByRecipientId: (rid)       => apiClient.get('/notifications', { params: { recipient_id: rid, grouped: true } }).then(r => r.data),
    create:             (data)           => apiClient.post('/notifications', data).then(r => r.data),
    update:             (id, data)       => apiClient.patch(`/notifications/${id}`, data).then(r => r.data),
    delete:             (id)             => apiClient.delete(`/notifications/${id}`).then(r => r.data),
};
