import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

// TO BE REMOVED: This is a temporary import for demonstration purposes. In a real application, you would fetch the current user from your authentication context or state management solution.
import { usersData } from '../mocks/data';
const currentUser = usersData[0];
// TO BE REMOVED: This is a temporary import for demonstration purposes. In a real application, you would fetch the current user from your authentication context or state management solution.

export default function MainLayout() {
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const toggleInspector = () => setIsInspectorOpen((prev) => !prev);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-main">
            <Sidebar user={currentUser} />

            <main className="relative flex min-w-0 flex-1 flex-col">
                <Topbar onToggleInspector={toggleInspector} isInspectorOpen={isInspectorOpen} />

                <div className="flex-1 overflow-y-auto bg-background p-6">
                    <Outlet />
                </div>
            </main>

            {isInspectorOpen && (
                <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-surface p-6 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
                    <h2 className="mb-4 text-lg font-bold">Inspector</h2>
                    <div className="text-sm text-muted">Select a document row to view details here.</div>
                </aside>
            )}
        </div>
    );
}
