import * as mocks from '../mocks/service';
// Later, we will import * as live from './api/...';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// 2. The Manager's Decision Logic
// If USE_MOCK is true, export the mock service.
// (For now, if false, we just export empty objects until we build the real API)
export const departmentsService = USE_MOCK ? mocks.mockDepartmentsService : {};

export const usersService = USE_MOCK ? mocks.mockUsersService : {};
export const userCredentialsService = USE_MOCK ? mocks.mockUserCredentialsService : {};
export const userSettingsService = USE_MOCK ? mocks.mockUserSettingsService : {};
export const userSessionsService = USE_MOCK ? mocks.mockUserSessionsService : {};

export const documentsService = USE_MOCK ? mocks.mockDocumentsService : {};
export const documentVersionsService = USE_MOCK ? mocks.mockDocumentVersionsService : {};
export const documentRequestsService = USE_MOCK ? mocks.mockDocumentRequestsService : {};
export const documentRequestMessagesService = USE_MOCK ? mocks.mockDocumentRequestMessagesService : {};
export const documentSharesService = USE_MOCK ? mocks.mockDocumentSharesService : {};

export const coordinatorRequestsService = USE_MOCK ? mocks.mockCoordinatorRequestsService : {};

export const notificationsService = USE_MOCK ? mocks.mockNotificationsService : {};

export const auditLogsService = USE_MOCK ? mocks.mockAuditLogsService : {};
