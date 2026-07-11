import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useAuthentication, useDocument, useUserSetting, useAuditLog, useDepartment, useUser, useCoordinatorRequest, useDocumentRequest, useDocumentShare, useDocumentVersion, useNotification, useDocumentRequestMessage } from '../stores';
import { USER_SETTINGS_THEME } from '../constants';

import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import Inspector from '../components/layout/Inspector';
import DepartmentInspector from '../components/management/DepartmentInspector';
import UserInspector from '../components/management/UserInspector';
import CoordinatorRequestInspector from '../components/management/CoordinatorRequestInspector';
import DocumentRequestInspector from '../components/management/DocumentRequestInspector';
import ViewDocumentModal from '../components/documents/ViewDocumentModal';

// ==============================================================================
// SECTION 1: LAYOUT
// ==============================================================================

export default function MainLayout() {
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    const { user } = useAuthentication();
    const { activeDocument } = useDocument();
    const { activeAuditLog } = useAuditLog();
    const { userSetting, getByUserId } = useUserSetting();
    const { activeDepartment } = useDepartment();
    const { activeUser } = useUser();
    const { activeCoordinatorRequest } = useCoordinatorRequest();
    const { activeDocumentRequest } = useDocumentRequest();

    // --- Load Settings if missing ---
    useEffect(() => {
        if (user?.id && !userSetting) {
            getByUserId(user.id);
        }
    }, [user?.id, userSetting, getByUserId]);

    // --- Apply Theme ---
    useEffect(() => {
        if (!userSetting?.theme) return;

        const root = document.documentElement;
        if (userSetting.theme === USER_SETTINGS_THEME.DARK) {
            root.classList.add('dark');
        } else if (userSetting.theme === USER_SETTINGS_THEME.LIGHT) {
            root.classList.remove('dark');
        } else {
            // SYSTEM
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [userSetting?.theme]);

    const location = useLocation();

    // --- Clear selections on page change ---
    useEffect(() => {
        useDocument.getState().deselectActiveDocument();
        useAuditLog.getState().deselectActiveAuditLog();
        useDepartment.getState().deselectActiveDepartment();
        useUser.getState().deselectActiveUser();
        useCoordinatorRequest.getState().deselectActiveCoordinatorRequest();
        useDocumentRequest.getState().deselectActiveDocumentRequest();
        setIsInspectorOpen(false);
    }, [location.pathname]);

    // --- Automatically open inspector when any relevant entity is selected ---
    useEffect(() => {
        if (activeDocument || activeAuditLog || activeDepartment || activeUser || activeCoordinatorRequest || activeDocumentRequest) {
            setIsInspectorOpen(true);
        }
    }, [activeDocument?.id, activeAuditLog?.id, activeDepartment?.id, activeUser?.id, activeCoordinatorRequest?.id, activeDocumentRequest?.id]);

    // --- Global WebSocket for Live Refresh ---
    useEffect(() => {
        if (!user) return;
        
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const wsUrl = baseUrl.replace('http', 'ws').replace(/\/api\/?$/, '/logs');
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => console.log('[MainLayout] Connected to live event stream');
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'REFRESH_DATA') {
                    console.log('[MainLayout] Received REFRESH_DATA:', message.data);
                    // Globally trigger store refreshes to sync UI
                    useDocument.getState().getAll();
                    useDocumentShare.getState().getAll();
                    useDocumentVersion.getState().getAll();
                    useDocumentRequest.getState().getAll();
                    useUser.getState().getAll();
                    useDepartment.getState().getAll();
                    useNotification.getState().getAll();
                    useAuditLog.getState().getAll();
                    useCoordinatorRequest.getState().getAll();
                    
                    // Note: useDocumentRequestMessage is tied to a specific request ID, 
                    // so we shouldn't indiscriminately call getAll() unless we know the active request.
                    // If there is an activeDocumentRequest, we refetch its messages.
                    const activeDocReqId = useDocumentRequest.getState().activeDocumentRequest?.id;
                    if (activeDocReqId) {
                        useDocumentRequestMessage.getState().getByDocumentRequestId(activeDocReqId);
                    }
                }
            } catch (err) {
                console.error('[MainLayout] WebSocket message error:', err);
            }
        };
        ws.onclose = () => console.log('[MainLayout] Disconnected from live event stream');
        
        return () => {
            if (ws.readyState === 1) {
                ws.close();
            }
        };
    }, [user]);

    // --- Handlers ---
    const handleToggleInspector = () => setIsInspectorOpen((previous) => !previous);
    const handleCloseInspector = () => setIsInspectorOpen(false);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-main">
            <Sidebar user={user} />

            <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar
                    onToggleInspector={handleToggleInspector}
                    isInspectorOpen={isInspectorOpen}
                />

                <div className="flex-1 overflow-y-auto p-4">
                    <Outlet />
                </div>
            </main>

            {isInspectorOpen && (
                <>
                    {(activeDocument || activeAuditLog) && (
                        <Inspector document={activeDocument} auditLog={activeAuditLog} onClose={handleCloseInspector} />
                    )}
                    {activeDepartment && (
                        <DepartmentInspector department={activeDepartment} onClose={handleCloseInspector} />
                    )}
                    {activeUser && (
                        <UserInspector user={activeUser} onClose={handleCloseInspector} />
                    )}
                    {activeCoordinatorRequest && (
                        <CoordinatorRequestInspector request={activeCoordinatorRequest} onClose={handleCloseInspector} />
                    )}
                    {activeDocumentRequest && (
                        <DocumentRequestInspector request={activeDocumentRequest} onClose={handleCloseInspector} />
                    )}
                </>
            )}

            {/* Global View Modal */}
            <ViewDocumentModal />
        </div>
    );
}
