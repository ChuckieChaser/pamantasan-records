import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, PanelRight, FileText, Loader2, Sparkles } from 'lucide-react';

import { useAuthentication, useNotification, useDocument, useDocumentRequest, useCoordinatorRequest, useUser, useDepartment, useDocumentViewer } from '../../stores';
import { IconButton, InputField, NotificationMenu, Breadcrumb } from '../ui';
import { apiClient } from '../../services/api/axios';

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
    const { openViewer } = useDocumentViewer();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // --- Search UI Outside Click ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Semantic Search Debounce ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            
            setIsSearching(true);
            try {
                const response = await apiClient.get(`/documents/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(response.data);
                setShowResults(true);
            } catch (err) {
                console.error("Semantic search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 800); // 800ms debounce to give them time to finish typing the semantic query
        
        return () => clearTimeout(timer);
    }, [searchQuery]);

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
                <div className="relative w-80" ref={searchRef}>
                    <InputField
                        leftIcon={Search}
                        rightIcon={isSearching ? Loader2 : null}
                        rightIconClassName={isSearching ? "animate-spin text-primary" : ""}
                        placeholder="Ask AI to find a file..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => {
                            if (searchQuery.trim().length >= 2) setShowResults(true);
                        }}
                    />
                    
                    {/* Semantic Search Dropdown */}
                    {showResults && searchQuery.trim().length >= 2 && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-surface-elevated p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-text-muted">
                                <Sparkles size={14} className="text-primary" />
                                AI Semantic Search
                            </div>
                            
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center p-6 text-sm text-text-muted">
                                    <Loader2 size={24} className="mb-2 animate-spin text-primary" />
                                    Scanning concepts...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                                    {searchResults.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => {
                                                setShowResults(false);
                                                setSearchQuery('');
                                                openViewer(doc);
                                            }}
                                            className="flex flex-col items-start gap-1 text-left rounded-lg p-2 transition-colors hover:bg-surface-hover"
                                        >
                                            <div className="flex w-full items-center gap-2 font-medium text-text">
                                                <FileText size={14} className="text-primary shrink-0" />
                                                <span className="truncate">{doc.name}</span>
                                            </div>
                                            {doc.summary && (
                                                <div className="w-full text-xs text-text-muted line-clamp-2">
                                                    {doc.summary}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-text-muted">
                                    No documents match this concept.
                                </div>
                            )}
                        </div>
                    )}
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
