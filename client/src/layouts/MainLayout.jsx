import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { useAuthentication, useDocument, useUserSetting, useAuditLog, useDepartment, useUser, useCoordinatorRequest, useDocumentRequest } from '../stores';
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

    // --- Automatically open inspector when any relevant entity is selected ---
    useEffect(() => {
        if (activeDocument || activeAuditLog || activeDepartment || activeUser || activeCoordinatorRequest || activeDocumentRequest) {
            setIsInspectorOpen(true);
        }
    }, [activeDocument?.id, activeAuditLog?.id, activeDepartment?.id, activeUser?.id, activeCoordinatorRequest?.id, activeDocumentRequest?.id]);

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
