import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, PanelRight } from 'lucide-react';

import { useAuthentication, useNotification, useDocument } from '../../stores';
import { IconButton, InputField, NotificationMenu, Breadcrumb } from '../ui';

// ==============================================================================
// SECTION 1: TOPBAR
// ==============================================================================

// --- Topbar: layout panel → flush, no border radius, border-b only ---
const Topbar = ({ onToggleInspector, isInspectorOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useAuthentication();
    const { notifications, unreadCount, getGroupedByRecipientId } = useNotification();
    const { documents } = useDocument();

    // --- Load notifications when the authenticated user changes ---
    useEffect(() => {
        if (user?.id) getGroupedByRecipientId(user.id);
    }, [user?.id, getGroupedByRecipientId]);

    // --- Breadcrumb computation ---
    const searchParams = new URLSearchParams(location.search);
    const folderId = searchParams.get('folder');
    
    let pathSegments = [];
    if (location.pathname.startsWith('/documents') || location.pathname.startsWith('/archives')) {
        const basePath = location.pathname.startsWith('/documents') ? '/documents' : '/archives';
        const baseLabel = location.pathname.startsWith('/documents') ? 'documents' : 'archives';
        
        pathSegments.push({ label: baseLabel, onClick: () => navigate(basePath) });
        
        if (folderId && documents.length > 0) {
            const folderChain = [];
            let current = documents.find(d => d.id === folderId);
            while (current) {
                const id = current.id;
                folderChain.unshift({
                    label: current.name,
                    onClick: () => navigate(`${basePath}?folder=${id}`)
                });
                current = documents.find(d => d.id === current.parent_id);
            }
            pathSegments.push(...folderChain);
        }
    } else {
        pathSegments = location.pathname.split('/').filter((segment) => segment !== '').map(s => ({ label: s }));
    }

    // --- Shape notifications for the menu component ---
    const notificationItems = notifications.map((notification) => {
        const isPlural = notification.group_count > 1;
        const actorText = isPlural ? `${notification.actor_name} and others` : notification.actor_name;

        const titleNode = (
            <span className="text-main">
                <span className="font-semibold text-accent">{actorText}</span>
                {' '}
                <span className="lowercase">{notification.action.replace(/_/g, ' ')}</span>
                {' on '}
                <span className="font-semibold text-accent">{notification.entity_name}</span>
            </span>
        );

        return {
            title: titleNode,
            message: null,
            time: new Date(notification.created_at).toLocaleString(),
            count: notification.group_count,
            avatar: notification.actor_avatar,
        };
    });

    return (
        <header className="flex w-full shrink-0 items-center justify-between p-4">
            {/* --- Breadcrumb --- */}
            <Breadcrumb segments={pathSegments} />

            {/* --- Actions --- */}
            <div className="flex items-center gap-4">
                <div className="w-72 cursor-not-allowed opacity-50" title="Global search — coming soon">
                    <InputField leftIcon={Search} placeholder="Search... (coming soon)" disabled />
                </div>

                <NotificationMenu
                    hasUnread={unreadCount > 0}
                    notifications={notificationItems}
                />

                <IconButton
                    icon={PanelRight}
                    size="medium"
                    active={isInspectorOpen}
                    onClick={onToggleInspector}
                />
            </div>
        </header>
    );
};

export default Topbar;
