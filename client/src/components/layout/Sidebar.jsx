import { useLocation, useNavigate } from 'react-router-dom';
import { USERS_ROLE } from '../../constants';
import { ImageButton, NavigationButton } from '../ui/Buttons';

import { LayoutDashboard, Users, FileText, Archive, ClipboardList } from 'lucide-react';

import logo from '../../assets/logo.jpg';
import avatar from '../../assets/avatar.png';

export default function Sidebar({ user }) {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname.includes(path);

    const canViewManagement = user.role === USERS_ROLE.ADMINISTRATOR || user.role === USERS_ROLE.COORDINATOR;
    const canViewRequests = user.role !== USERS_ROLE.ADMINISTRATOR && user.role !== USERS_ROLE.COORDINATOR;

    return (
        <aside className="flex h-full w-20 shrink-0 flex-col items-center justify-between border-r border-border bg-surface py-6">
            <div className="flex flex-col items-center gap-4">
                <ImageButton src={logo} alt="University Logo" size="large" />
            </div>

            <nav className="flex flex-col items-center gap-4">
                <NavigationButton icon={LayoutDashboard} active={isActive('/dashboard')} onClick={() => navigate('/dashboard')} title="Dashboard" />

                {canViewManagement && <NavigationButton icon={Users} active={isActive('/management')} onClick={() => navigate('/management')} title="Management" />}

                <NavigationButton icon={FileText} active={isActive('/documents')} onClick={() => navigate('/documents')} title="Documents" />

                <NavigationButton icon={Archive} active={isActive('/archives')} onClick={() => navigate('/archives')} title="Archives" />

                {canViewRequests && <NavigationButton icon={ClipboardList} active={isActive('/requests')} onClick={() => navigate('/requests')} title="Requests" />}
            </nav>

            <div className="flex flex-col items-center gap-4">
                <ImageButton src={user.avatar_path || avatar} alt={`${user.first_name} Profile`} size="medium" />
            </div>
        </aside>
    );
}
