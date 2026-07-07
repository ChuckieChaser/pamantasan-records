import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { useAuthentication, useDocument, useUserSetting, useAuditLog } from '../stores';
import { USER_SETTINGS_THEME } from '../constants';

import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import Inspector from '../components/layout/Inspector';

// ==============================================================================
// SECTION 1: LAYOUT
// ==============================================================================

export default function MainLayout() {
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    const { user } = useAuthentication();
    const { activeDocument } = useDocument();
    const { activeAuditLog } = useAuditLog();
    const { userSetting, getByUserId } = useUserSetting();

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

    // --- Automatically open inspector when a document or audit log is selected ---
    useEffect(() => {
        if (activeDocument || activeAuditLog) {
            setIsInspectorOpen(true);
        }
    }, [activeDocument?.id, activeAuditLog?.id]);

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
                <Inspector document={activeDocument} auditLog={activeAuditLog} onClose={handleCloseInspector} />
            )}
        </div>
    );
}
