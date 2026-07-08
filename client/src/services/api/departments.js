import { apiClient } from './axios';

export const departmentsApi = {
    getAll:   ()           => apiClient.get('/departments').then(r => r.data),
    getById:  (id)         => apiClient.get(`/departments/${id}`).then(r => r.data),
    getByCode:(code)       => apiClient.get('/departments').then(r => r.data.find(d => d.code === code) ?? null),
    create:   (data)       => apiClient.post('/departments', data).then(r => r.data),
    update:   (id, data)   => apiClient.patch(`/departments/${id}`, data).then(r => r.data),
    delete:   (id)         => apiClient.delete(`/departments/${id}`).then(r => r.data),
};
