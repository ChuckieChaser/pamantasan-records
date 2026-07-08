import { apiClient } from './axios';

export const coordinatorsApi = {
    getAll:           (params = {})  => apiClient.get('/coordinators', { params }).then(r => r.data),
    getById:          (id)           => apiClient.get(`/coordinators/${id}`).then(r => r.data),
    getByRequesterId: (rid)          => apiClient.get('/coordinators', { params: { requester_id: rid } }).then(r => r.data),
    getByReviewerId:  (rid)          => apiClient.get('/coordinators', { params: { reviewer_id: rid } }).then(r => r.data),
    getByStatus:      (status)       => apiClient.get('/coordinators', { params: { status } }).then(r => r.data),
    create:           (data)         => apiClient.post('/coordinators', data).then(r => r.data),
    update:           (id, data)     => apiClient.patch(`/coordinators/${id}`, data).then(r => r.data),
    delete:           (id)           => apiClient.delete(`/coordinators/${id}`).then(r => r.data),
};
