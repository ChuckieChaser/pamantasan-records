// ==============================================================================
// SERVICES — Live API
// All service exports map 1:1 to the mock service interface, but now call the
// real backend instead of in-memory data. Mocks folder has been removed.
// ==============================================================================

import { departmentsApi }  from './api/departments';
import { usersApi }        from './api/users';
import { documentsApi }    from './api/documents';
import { coordinatorsApi } from './api/coordinators';
import { notificationsApi } from './api/notifications';
import { auditsApi }       from './api/audits';

// --- Departments ---
export { documentsApi };
export const departmentsService = departmentsApi;

// --- Users ---
export const usersService            = usersApi;
export const userCredentialsService  = {}; // Managed server-side only
export const userSettingsService     = {
    getByUserId: (id)         => usersApi.getSettings(id),
    create:      (id)         => Promise.resolve(), // Created automatically on user creation
    update:      (id, data)   => usersApi.updateSettings(id, data),
};
export const userSessionsService     = {}; // No client-side session management without JWT

// --- Documents ---
export const documentsService               = {
    getAll:          (params)      => documentsApi.getAll(params),
    getById:         (id)          => documentsApi.getById(id),
    getByUploaderId: (uid)         => documentsApi.getByUploaderId(uid),
    create:          (data)        => documentsApi.create(data),
    update:          (id, data)    => documentsApi.update(id, data),
    delete:          (id)          => documentsApi.delete(id),
};
export const documentVersionsService        = {
    getAll:          ()            => documentsApi.getAll().then(() => []), // Fetched per document
    getByDocumentId: (docId)       => documentsApi.getVersions(docId),
    create:          (docId, form) => documentsApi.upload(docId, form),
    update:          ()            => Promise.resolve(), // Versions are immutable
    revert:          (docId, data) => documentsApi.revert(docId, data),
};
export const documentRequestsService        = {
    getAll:              (params)  => documentsApi.getRequests(params),
    getById:             (id)      => documentsApi.getRequestById(id),
    getByRequesterId:    (rid)     => documentsApi.getRequestsByRequesterId(rid),
    create:              (data)    => documentsApi.createRequest(data),
    update:              (id, d)   => documentsApi.updateRequest(id, d),
    delete:              (id)      => documentsApi.deleteRequest(id),
};
export const documentRequestMessagesService = {
    getByDocumentRequestId: (rid)  => documentsApi.getMessages(rid),
    create:                 (data) => documentsApi.createMessage(data.document_request_id, data),
};
export const documentSharesService          = {
    getAll:              ()        => documentsApi.getShares(),
    getByDocumentId:     (docId)   => documentsApi.getSharesByDocId(docId),
    getByDepartmentId:   ()        => documentsApi.getShares(),
    create:              (data)    => documentsApi.createShare(data),
    update:              (id, data)=> documentsApi.updateShare(id, data),
    delete:              (id)      => documentsApi.deleteShare(id),
};

// --- Coordinator Requests ---
export const coordinatorRequestsService = coordinatorsApi;

// --- Notifications ---
export const notificationsService = notificationsApi;

// --- Audit Logs ---
export const auditLogsService = auditsApi;
