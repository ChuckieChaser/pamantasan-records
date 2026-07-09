import { apiClient } from './axios';

export const documentsApi = {
    // --- Documents ---
    getAll:           (params = {})  => apiClient.get('/documents', { params }).then(r => r.data),
    getById:          (id)           => apiClient.get(`/documents/${id}`).then(r => r.data),
    getByUploaderId:  (uid)          => apiClient.get('/documents', { params: { uploader_id: uid } }).then(r => r.data),
    create:           (data)         => apiClient.post('/documents', data).then(r => r.data),
    update:           (id, data)     => apiClient.patch(`/documents/${id}`, data).then(r => r.data),
    delete:           (id)           => apiClient.delete(`/documents/${id}`).then(r => r.data),

    // --- Versions ---
    getVersions:      (docId)        => apiClient.get(`/documents/${docId}/versions`).then(r => r.data),
    upload:           (docId, formData) =>
        apiClient.post(`/documents/${docId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data),
    revert:           (docId, data)  => apiClient.post(`/documents/${docId}/revert`, data).then(r => r.data),
    download:         (id)           => apiClient.get(`/documents/${id}/download`, { responseType: 'blob' }).then(r => r.data),
    downloadZip:      (id)           => apiClient.get(`/documents/${id}/download-zip`, { responseType: 'blob' }).then(r => r.data),

    // --- Shares ---
    getShares:        ()             => apiClient.get('/documents/shares/all').then(r => r.data),
    getSharesByDocId: (docId)        => apiClient.get('/documents/shares/all', { params: { document_id: docId } }).then(r => r.data),
    createShare:      (data)         => apiClient.post('/documents/shares', data).then(r => r.data),
    updateShare:      (id, data)     => apiClient.patch(`/documents/shares/${id}`, data).then(r => r.data),
    deleteShare:      (id)           => apiClient.delete(`/documents/shares/${id}`).then(r => r.data),

    // --- Requests ---
    getRequests:      (params = {})  => apiClient.get('/documents/requests', { params }).then(r => r.data),
    getRequestById:   (id)           => apiClient.get(`/documents/requests/${id}`).then(r => r.data),
    getRequestsByRequesterId: (rid)  => apiClient.get('/documents/requests', { params: { requester_id: rid } }).then(r => r.data),
    createRequest:    (data)         => apiClient.post('/documents/requests', data).then(r => r.data),
    updateRequest:    (id, data)     => apiClient.patch(`/documents/requests/${id}`, data).then(r => r.data),
    deleteRequest:    (id)           => apiClient.delete(`/documents/requests/${id}`).then(r => r.data),

    // --- Messages & Attachments ---
    getMessages:      (reqId)        => apiClient.get(`/documents/requests/${reqId}/messages`).then(r => r.data),
    createMessage:    (reqId, data)  => apiClient.post(`/documents/requests/${reqId}/messages`, data).then(r => r.data),
    createAttachment: (data)         => apiClient.post(`/documents/attachments`, data).then(r => r.data),
};
