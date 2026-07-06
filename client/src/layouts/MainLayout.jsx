import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { useAuthentication, useDocument } from '../stores';

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
                <Inspector document={activeDocument} onClose={handleCloseInspector} />
            )}
        </div>
    );
}
