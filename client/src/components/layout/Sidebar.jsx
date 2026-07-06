import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, FileText, Archive, ClipboardList } from 'lucide-react';

import { useAuthentication } from '../../stores';
import { USERS_ROLE } from '../../constants';
import { ImageButton, NavigationButton, UserMenu } from '../ui';

import logo from '../../assets/logo.jpg';

// ==============================================================================
// SECTION 1: NAVIGATION CONFIG
// ==============================================================================

// --- Routes visible to all roles ---
const SHARED_ROUTES = [
    { path: '/dashboard', icon: LayoutDashboard, title: 'Dashboard' },
    { path: '/documents', icon: FileText, title: 'Documents' },
    { path: '/archives', icon: Archive, title: 'Archives' },
];

// --- Routes visible only to Administrator and Coordinator ---
const MANAGEMENT_ROUTES = [
    { path: '/management', icon: Box, title: 'Management' },
];

// --- Routes visible only to Director, Officer, Member ---
const REQUESTER_ROUTES = [
    { path: '/requests', icon: ClipboardList, title: 'Requests' },
];

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
        ...SHARED_ROUTES,
        ...(isAdminOrCoordinator ? MANAGEMENT_ROUTES : REQUESTER_ROUTES),
    ];

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <aside className="flex h-full shrink-0 flex-col items-center justify-between border-r border-border bg-surface p-4">
            {/* --- Logo --- */}
            <div className="flex flex-col items-center">
                <ImageButton src={logo} alt="University Logo" size="large" />
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
