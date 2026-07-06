import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, PanelRight, ChevronRight } from 'lucide-react';

import { useAuthentication, useNotification } from '../../stores';
import { IconButton, InputField, NotificationMenu } from '../ui';

// ==============================================================================
// SECTION 1: TOPBAR
// ==============================================================================

// --- Topbar: layout panel → flush, no border radius, border-b only ---
const Topbar = ({ onToggleInspector, isInspectorOpen }) => {
    const location = useLocation();

    const { user } = useAuthentication();
    const { notifications, unreadCount, getByRecipientId } = useNotification();

    // --- Load notifications when the authenticated user changes ---
    useEffect(() => {
        if (user?.id) getByRecipientId(user.id);
    }, [user?.id, getByRecipientId]);

    // --- Breadcrumb computation ---
    const pathSegments = location.pathname.split('/').filter((segment) => segment !== '');

    // --- Shape notifications for the menu component ---
    const notificationItems = notifications.map((notification) => ({
        title: `${notification.action} — ${notification.entity_type}`,
        message: null,
        time: new Date(notification.created_at).toLocaleString(),
    }));

    return (
        <header className="flex w-full shrink-0 items-center justify-between p-4">
            {/* --- Breadcrumb --- */}
            <div className="flex items-center gap-2 text-sm font-medium capitalize text-muted">
                {pathSegments.length === 0 ? (
                    <span className="text-main">Home</span>
                ) : (
                    pathSegments.map((segment, index) => {
                        const isLast = index === pathSegments.length - 1;
                        return (
                            <div key={segment} className="flex items-center gap-2">
                                {index > 0 && <ChevronRight className="size-4 shrink-0 text-border" />}
                                <span className={isLast ? 'text-main' : 'text-muted'}>{segment}</span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- Actions --- */}
            <div className="flex items-center gap-2">
                <div className="w-72">
                    <InputField leftIcon={Search} placeholder="Search anything..." />
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
