import { apiClient } from './axios';

export const auditsApi = {
    getAll:          (params = {})  => apiClient.get('/audits', { params }).then(r => r.data),
    getById:         (id)           => apiClient.get(`/audits/${id}`).then(r => r.data),
    getByActorId:    (actorId)      => apiClient.get('/audits', { params: { actor_id: actorId } }).then(r => r.data),
    getByEntityType: (entityType)   => apiClient.get('/audits', { params: { entity_type: entityType } }).then(r => r.data),
    getByEntityId:   (entityId)     => apiClient.get('/audits', { params: { entity_id: entityId } }).then(r => r.data),
    create:          (data)         => apiClient.post('/audits', data).then(r => r.data),
};
