import { apiClient } from './axios';

export const usersApi = {
    // --- Users ---
    getAll:           (params = {})  => apiClient.get('/users', { params }).then(r => r.data),
    getById:          (id)           => apiClient.get(`/users/${id}`).then(r => r.data),
    getByUniversityId:(uid)          => apiClient.get('/users', { params: { university_id: uid } }).then(r => r.data[0] ?? null),
    getByDepartmentId:(deptId)       => apiClient.get('/users', { params: { department_id: deptId } }).then(r => r.data),
    getByRole:        (role)         => apiClient.get('/users', { params: { role } }).then(r => r.data),
    create:           (data)         => apiClient.post('/users', data).then(r => r.data),
    update:           (id, data)     => apiClient.patch(`/users/${id}`, data).then(r => r.data),

    // --- Settings ---
    getSettings:      (id)           => apiClient.get(`/users/${id}/settings`).then(r => r.data),
    updateSettings:   (id, data)     => apiClient.patch(`/users/${id}/settings`, data).then(r => r.data),
};
