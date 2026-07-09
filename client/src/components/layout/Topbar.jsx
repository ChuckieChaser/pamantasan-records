import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, PanelRight } from 'lucide-react';

import { useAuthentication, useNotification, useDocument, useDocumentRequest, useCoordinatorRequest, useUser, useDepartment } from '../../stores';
import { IconButton, InputField, NotificationMenu, Breadcrumb } from '../ui';

// ==============================================================================
// SECTION 1: TOPBAR
// ==============================================================================

// --- Topbar: layout panel → flush, no border radius, border-b only ---
const Topbar = ({ onToggleInspector, isInspectorOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useAuthentication();
    const { notifications, unreadCount, getGroupedByRecipientId, update: updateNotification } = useNotification();
    const { documents } = useDocument();
    const { users } = useUser();
    const { departments } = useDepartment();

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
        const isPlural = notification.interaction_count > 1;
        
        let actorName = 'System';
        let foundUser = null;
        if (notification.actor_ids && notification.actor_ids.length > 0) {
            const firstActorId = notification.actor_ids[0];
            foundUser = users.find(u => u.id === firstActorId);
            if (foundUser) {
                actorName = `${foundUser.first_name} ${foundUser.last_name}`;
            } else {
                actorName = 'A user';
            }
        }
        
        const actorText = isPlural ? `${actorName} and others` : actorName;
        const actionText = notification.action ? notification.action.replace(/_/g, ' ').toLowerCase() : 'interacted with';
        
        let targetText = notification.entity_type;
        switch (notification.entity_type) {
            case 'DOCUMENT':
            case 'DOCUMENT_VERSION':
            case 'DOCUMENT_SHARE': {
                const doc = documents.find(d => d.id === notification.entity_id);
                targetText = doc ? doc.name : 'a document';
                break;
            }
            case 'USER':
            case 'USER_CREDENTIAL':
            case 'USER_SESSION':
            case 'USER_SETTING': {
                const u = users.find(u => u.id === notification.entity_id);
                targetText = u ? `${u.first_name} ${u.last_name}` : 'a user';
                break;
            }
            case 'DEPARTMENT': {
                const dept = departments.find(d => d.id === notification.entity_id);
                targetText = dept ? dept.name : 'a department';
                break;
            }
            case 'DOCUMENT_REQUEST':
            case 'DOCUMENT_REQUEST_ATTACHMENT':
            case 'DOCUMENT_REQUEST_MESSAGE':
                targetText = 'a document request';
                break;
            case 'COORDINATOR_REQUEST':
                targetText = 'a coordinator request';
                break;
        }

        const titleNode = (
            <span className="text-main">
                <span className="font-semibold text-accent">{actorText}</span>
                {' '}
                <span>{actionText}</span>
                {' '}
                <span className="font-semibold text-accent">{targetText}</span>
            </span>
        );

        return {
            title: titleNode,
            message: null,
            time: new Date(notification.last_interaction_at).toLocaleString(),
            count: notification.interaction_count,
            avatar: foundUser ? foundUser.avatar_path : null,
            is_read: notification.is_read,
            onClick: async () => {
                if (notification.notification_ids && !notification.is_read) {
                    await updateNotification(notification.notification_ids.join(','), { is_read: true });
                }
                
                switch(notification.entity_type) {
                    case 'DOCUMENT':
                    case 'DOCUMENT_VERSION':
                    case 'DOCUMENT_SHARE':
                        navigate('/documents');
                        useDocument.getState().selectActiveDocument(notification.entity_id);
                        break;
                    case 'DOCUMENT_REQUEST':
                    case 'DOCUMENT_REQUEST_ATTACHMENT':
                    case 'DOCUMENT_REQUEST_MESSAGE':
                        navigate('/management');
                        useDocumentRequest.getState().selectActiveDocumentRequest(notification.entity_id);
                        break;
                    case 'COORDINATOR_REQUEST':
                        navigate('/management');
                        useCoordinatorRequest.getState().selectActiveCoordinatorRequest(notification.entity_id);
                        break;
                    case 'USER':
                    case 'USER_CREDENTIAL':
                    case 'USER_SESSION':
                    case 'USER_SETTING':
                        navigate('/management');
                        useUser.getState().selectActiveUser(notification.entity_id);
                        break;
                    case 'DEPARTMENT':
                        navigate('/management');
                        useDepartment.getState().selectActiveDepartment(notification.entity_id);
                        break;
                }
            }
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
