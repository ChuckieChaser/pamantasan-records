import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const current_user = {
    avatar_path: null,
    name: 'Admin User',
    role: 'ADMINISTRATOR',
};

export default function MainLayout() {
    return (
        // The absolute outer container. It takes up the full screen and prevents scrolling on the body.
        <div className="flex h-screen w-screen overflow-hidden bg-background text-main">
            <Sidebar user={current_user} />

            {/* ========================================= */}
            {/* PANE 2: THE MAIN WORKSPACE (Center)       */}
            {/* ========================================= */}
            {/* flex-1 allows this pane to grow and fill all remaining space. */}
            <main className="relative flex min-w-0 flex-1 flex-col">
                {/* THE TOPBAR */}
                {/* h-16 sets a fixed height. */}
                <header className="flex h-16 shrink-0 items-center border-b border-border bg-surface px-6">
                    <div className="text-sm text-muted">Topbar & Search Placeholder</div>
                </header>

                {/* THE DYNAMIC CONTENT AREA */}
                {/* overflow-y-auto allows ONLY this area to scroll if the table gets too long. */}
                <div className="flex-1 overflow-y-auto bg-background p-6">
                    {/* Again, Outlet injects the specific page (Dashboard, Documents) here. */}
                    <Outlet />
                </div>
            </main>

            {/* ========================================= */}
            {/* PANE 3: THE DETAIL PANEL (Right)          */}
            {/* ========================================= */}
            {/* We will conditionally hide/show this later using Zustand. */}
            {/* w-80 sets a fixed width for the metadata drawer. */}
            <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface p-6 xl:flex">
                <div className="text-sm text-muted">Detail Panel Placeholder</div>
            </aside>
        </div>
    );
}
