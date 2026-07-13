import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, FileText, Archive, ClipboardList } from 'lucide-react';

import { useAuthentication } from '../../stores';
import { USERS_ROLE } from '../../constants';
import { ImageButton, NavigationButton, UserMenu } from '../ui';


// ==============================================================================
// SECTION 1: NAVIGATION CONFIG
// ==============================================================================

// --- Individual Route Definitions ---
const ROUTE_DASHBOARD = { path: '/dashboard', icon: LayoutDashboard, title: 'Dashboard' };
const ROUTE_DOCUMENTS = { path: '/documents', icon: FileText, title: 'Documents' };
const ROUTE_ARCHIVES = { path: '/archives', icon: Archive, title: 'Archives' };
const ROUTE_MANAGEMENT = { path: '/management', icon: Box, title: 'Management' };
const ROUTE_REQUESTS = { path: '/requests', icon: ClipboardList, title: 'Requests' };

// ==============================================================================
// SECTION 2: COMPONENT
// ==============================================================================

// --- Sidebar: layout panel → flush, no border radius, no shadow ---
const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const { logout } = useAuthentication();

    // --- Computed ---
    const isAdminOrCoordinator = (
        user?.role === USERS_ROLE.ADMINISTRATOR
        || user?.role === USERS_ROLE.COORDINATOR
    );

    const visibleRoutes = [
        ROUTE_DASHBOARD,
        ...(isAdminOrCoordinator ? [ROUTE_MANAGEMENT] : []),
        ROUTE_DOCUMENTS,
        ROUTE_ARCHIVES,
        ...(!isAdminOrCoordinator ? [ROUTE_REQUESTS] : []),
    ];

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <aside className="flex h-full shrink-0 flex-col items-center justify-between border-r border-border bg-surface p-4">
            {/* --- Logo --- */}
            <div className="flex flex-col items-center">
                <ImageButton src="/logo.png" alt="University Logo" size="large" onClick={() => navigate('/dashboard')} />
            </div>

            {/* --- Navigation --- */}
            <nav className="flex flex-col items-center gap-4">
                {visibleRoutes.map((route) => (
                    <NavigationButton
                        key={route.path}
                        icon={route.icon}
                        title={route.title}
                        active={isActive(route.path)}
                        onClick={() => navigate(route.path)}
                    />
                ))}
            </nav>

            {/* --- User Menu --- */}
            <div className="flex flex-col items-center">
                <UserMenu user={user} onLogout={logout} />
            </div>
        </aside>
    );
};

export default Sidebar;
