import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { documentsApi } from '../../services/api/documents';
import {
    FileText, Sparkles, X, Building2, User, Users,
    Share2, Archive, Eye, Download, MessageSquare, RotateCcw,
    CheckCircle, XCircle, UploadCloud, EyeOff, RefreshCcw, Tag, Calendar, Search, Activity
} from 'lucide-react';
import { useAuthentication, useDocument, useDocumentVersion, useDocumentShare, useUser, useDepartment, useDocumentViewer, useCoordinatorRequest, useAttachment, useDocumentRequest } from '../../stores';
import { USERS_ROLE, DOCUMENT_SHARE_STATUS } from '../../constants';
import { IconButton, PrimaryButton, SecondaryButton, DestructiveButton, getFileIcon, Modal, TextArea, SelectField, InputField, ConfirmActionModal } from '../ui';
import DefaultAvatar from '../../assets/avatar.png';

// ==============================================================================
// SECTION 1: UTILITIES
// ==============================================================================

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ==============================================================================
// SECTION 2: LOCAL CONSTANTS
// ==============================================================================

const INSPECTOR_TABS = Object.freeze({
    METADATA: 'METADATA',
    VERSIONS: 'VERSIONS',
});

// ==============================================================================
// SECTION 3: COMPONENT
// ==============================================================================

const Inspector = ({ document, auditLog, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useAuthentication();
    const { update: updateDocument, delete: deleteDocument } = useDocument();
    const { documentVersions, create: createVersion, revert: revertVersion, getByDocumentId: getDocumentVersions } = useDocumentVersion();
    const { documentShares, create: createShare, update: updateShare, delete: deleteShare } = useDocumentShare();
    const { attachments } = useAttachment();
    const { documentRequests } = useDocumentRequest();
    const { create: createCoordinatorRequest } = useCoordinatorRequest();
    const { users, getAll: getUsers } = useUser();
    const { departments, getAll: getDepartments } = useDepartment();

    const [activeTab, setActiveTab] = useState(INSPECTOR_TABS.METADATA);
    const [activeVersionId, setActiveVersionId] = useState(null);

    useEffect(() => {
        if (users.length === 0) getUsers();
        if (departments.length === 0) getDepartments();
    }, [users.length, departments.length, getUsers, getDepartments]);

    useEffect(() => {
        if (document?.id && !document.is_folder) {
            getDocumentVersions(document.id);
        }
    }, [document?.id, document?.is_folder, getDocumentVersions]);

    const { openViewer } = useDocumentViewer();

    // --- Modal States ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    // --- Edit State ---
    const [editName, setEditName] = useState('');
    const [editComment, setEditComment] = useState('');
    const [editError, setEditError] = useState('');

    // --- Share/Publish State ---
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [shareDepartmentIds, setShareDepartmentIds] = useState([]);
    const [shareComment, setShareComment] = useState('');
    const [departmentSearch, setDepartmentSearch] = useState('');
    const [publishUserIds, setPublishUserIds] = useState([]);
    const [publishComment, setPublishComment] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [destructiveAction, setDestructiveAction] = useState(null);

    // --- Derived data (early) ---
    const eligibleUsers = useMemo(() => {
        if (!user || !user.department_id) return [];
        return users.filter(u => u.department_id === user.department_id && u.id !== user.id && u.role === USERS_ROLE.MEMBER);
    }, [users, user]);

    // --- Handlers ---
    const handleDownload = async () => {
        if (!document) return;
        try {
            let blob;
            let filename;
            if (document.is_folder) {
                blob = await documentsApi.downloadZip(document.id);
                filename = `${document.name}.zip`;
            } else {
                blob = await documentsApi.download(document.id);
                filename = document.name;
                
                // Ensure extension is present so browsers don't fallback to .zip
                const latestVersion = documentVersions.find(v => v.document_id === document.id);
                if (latestVersion && latestVersion.path) {
                    const parts = latestVersion.path.split('.');
                    if (parts.length > 1) {
                        const ext = '.' + parts.pop();
                        if (!filename.toLowerCase().endsWith(ext.toLowerCase())) {
                            filename += ext;
                        }
                    }
                }
            }

            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = filename;
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download', error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!document) return;
        try {
            await updateDocument(document.id, { comment: commentText });
            setIsCommentModalOpen(false);
            setCommentText('');
        } catch (error) {
            console.error('Failed to submit comment', error);
        }
    };

    const handleRevertSubmit = async () => {
        if (!activeVersionId || !document) return;
        try {
            await revertVersion(document.id, activeVersionId, user.id);
            setActiveVersionId(null);
            setIsRevertModalOpen(false);
        } catch (error) {
            console.error('Failed to revert version', error);
        }
    };

    const handleEditOpen = () => {
        setEditName(document.name);
        setEditComment(document.comment || '');
        setEditError('');
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async () => {
        if (!document) return;
        setEditError('');

        // Name conflict validation
        const { documents } = useDocument.getState();
        const conflict = documents.some(d => 
            d.id !== document.id &&
            !d.is_archived &&
            d.parent_id === document.parent_id &&
            d.name.toLowerCase() === editName.trim().toLowerCase()
        );
        
        if (conflict) {
            setEditError('A folder or file with this name already exists in this location.');
            return;
        }

        try {
            await updateDocument(document.id, { name: editName.trim(), comment: editComment || undefined });
            setIsEditModalOpen(false);
            setEditName('');
            setEditComment('');
        } catch (error) {
            console.error('Failed to edit document', error);
        }
    };

    const handleShareOpen = () => {
        setShareDepartmentIds([]);
        setIsShareModalOpen(true);
    };

    const handleShareSubmit = async () => {
        if (!document || shareDepartmentIds.length === 0) return;
        try {
            if (user.role === USERS_ROLE.COORDINATOR) {
                for (const deptId of shareDepartmentIds) {
                    await createCoordinatorRequest({
                        requester_id: user.id,
                        action: 'DOCUMENT_SHARE',
                        data: {
                            document_id: document.id,
                            sharer_id: user.id,
                            department_id: deptId,
                        }
                    });
                }
            } else {
                for (const deptId of shareDepartmentIds) {
                    await createShare({
                        document_id: document.id,
                        sharer_id: user.id,
                        department_id: deptId,
                    });
                }
            }
            setIsShareModalOpen(false);
            setShareDepartmentIds([]);
        } catch (error) {
            console.error('Failed to share document', error);
        }
    };

    const handleApproveSubmit = async () => {
        if (!document) return;
        try {
            const share = docShares.find(s => s.department_id === user?.department_id);
            if (!share) return;
            if (computedStatus === DOCUMENT_SHARE_STATUS.PENDING_APPROVAL) {
                await updateShare(share.id, { status: DOCUMENT_SHARE_STATUS.APPROVED });
            } else if (computedStatus === DOCUMENT_SHARE_STATUS.APPROVED) {
                await updateShare(share.id, { status: DOCUMENT_SHARE_STATUS.PUBLISHED });
            }
            setIsApproveModalOpen(false);
        } catch (error) {
            console.error('Failed to approve document', error);
        }
    };

    const handlePublishOpen = () => {
        setPublishUserIds(['ALL_USERS']);
        setPublishComment('');
        setIsPublishModalOpen(true);
    };

    const handlePublishSubmit = async () => {
        if (!document) return;
        try {
            const share = docShares.find(s => s.department_id === user?.department_id);
            if (!share) return;
            
            const recipientId = publishUserIds.includes('ALL_USERS') ? null : publishUserIds[0];
            
            await updateShare(share.id, { 
                status: DOCUMENT_SHARE_STATUS.PUBLISHED,
                recipient_id: recipientId
            });
            setIsPublishModalOpen(false);
        } catch (error) {
            console.error('Failed to publish document', error);
        }
    };

    const handleDestructiveSubmit = async () => {
        if (!document || !destructiveAction) return;
        try {
            if (destructiveAction === 'ARCHIVE') {
                if (user.role === USERS_ROLE.COORDINATOR) {
                    await createCoordinatorRequest({
                        requester_id: user.id,
                        action: 'DOCUMENT_ARCHIVE',
                        data: {
                            id: document.id,
                            is_archived: true,
                        }
                    });
                } else {
                    await updateDocument(document.id, { is_archived: true });
                }
            } else if (destructiveAction === 'UNARCHIVE') {
                if (user.role === USERS_ROLE.COORDINATOR) {
                    await createCoordinatorRequest({
                        requester_id: user.id,
                        action: 'DOCUMENT_ARCHIVE',
                        data: {
                            id: document.id,
                            is_archived: false,
                        }
                    });
                } else {
                    await updateDocument(document.id, { is_archived: false });
                }
            } else if (destructiveAction === 'DELETE') {
                if (user.role === USERS_ROLE.COORDINATOR) {
                    await createCoordinatorRequest({
                        requester_id: user.id,
                        action: 'DOCUMENT_DELETE',
                        data: {
                            id: document.id
                        }
                    });
                } else {
                    await deleteDocument(document.id);
                }
            } else if (destructiveAction === 'REJECT') {
                const share = docShares.find(s => s.department_id === user?.department_id);
                if (share) await deleteShare(share.id);
            } else if (destructiveAction === 'STASH') {
                const share = docShares.find(s => s.department_id === user?.department_id);
                if (share) await updateShare(share.id, { status: DOCUMENT_SHARE_STATUS.STASHED });
            } else if (destructiveAction === 'UNAPPROVE') {
                const share = docShares.find(s => s.department_id === user?.department_id);
                if (share) await updateShare(share.id, { status: DOCUMENT_SHARE_STATUS.PENDING_APPROVAL });
            } else if (destructiveAction === 'UNPUBLISH') {
                const share = docShares.find(s => s.department_id === user?.department_id);
                if (share) await updateShare(share.id, { status: DOCUMENT_SHARE_STATUS.APPROVED });
            } else if (destructiveAction === 'UNSHARE') {
                for (const share of docShares) {
                    if (user.role !== USERS_ROLE.COORDINATOR) {
                        await deleteShare(share.id);
                    }
                }
            }
            
            setDestructiveAction(null);
        } catch (error) {
            console.error('Failed to perform action', error);
        }
    };

    const toggleDepartment = (deptId) => {
        setShareDepartmentIds(prev => 
            prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
        );
    };

    const toggleAllDepartments = () => {
        if (shareDepartmentIds.length === departments.length) {
            setShareDepartmentIds([]);
        } else {
            setShareDepartmentIds(departments.map(d => d.id));
        }
    };

    const toggleUser = (userId) => {
                setPublishUserIds(prev => {
                    if (prev.includes('ALL_USERS')) {
                        return eligibleUsers.filter(u => u.id !== userId).map(u => u.id);
                    }
                    const next = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
                    if (next.length === eligibleUsers.length && eligibleUsers.length > 0) {
                        return ['ALL_USERS'];
                    }
                    return next;
                });
            };

            const toggleAllUsers = () => {
                if (publishUserIds.includes('ALL_USERS')) {
                    setPublishUserIds([]);
                } else {
                    setPublishUserIds(['ALL_USERS']);
                }
            };

            // --- Reset active version when document changes ---
            useEffect(() => {
                setActiveVersionId(null);
            }, [document?.id]);

            // --- Derived data ---

            const docVersions = useMemo(() =>
                document ? documentVersions.filter(v => v.document_id === document.id).sort((a, b) => b.version - a.version) : []
                , [document, documentVersions]);

            const latestVersion = docVersions[0];


            const docShares = useMemo(() =>
                document ? documentShares.filter(s => s.document_id === document.id) : []
                , [document, documentShares]);

            const docAttachments = useMemo(() =>
                document ? attachments.filter(a => a.document_id === document.id) : []
                , [document, attachments]);

            const getComputedStatus = () => {
                if (!document) return 'UPLOADED';
                if (document.is_archived) return 'ARCHIVED';
                if (docAttachments.length > 0) return 'ATTACHMENT';
                if (user?.department_id) {
                    const share = docShares.find(s => s.department_id === user.department_id);
                    if (share) return share.status;
                }
                if (docShares.length > 0) return docShares[0].status;
                return 'UPLOADED';
            };
            const computedStatus = getComputedStatus();


            // --- Role-based actions ---
            const renderActions = () => {
                if (!user || !document) return null;

                const role = user.role;
                const status = computedStatus;
                const secondaryActions = [];
                const primaryDestructiveActions = [];

                // Base actions available to all roles
                if (document.is_folder) {
                    secondaryActions.push(
                        <SecondaryButton key="open" size="small" icon={Eye} className="flex-1 justify-center" onClick={() => {
                            const basePath = location.pathname.startsWith('/archives') ? '/archives' : '/documents';
                            navigate(`${basePath}?folder=${document.id}`);
                        }}>Open</SecondaryButton>
                    );
                    if (!document.is_archived && status !== 'ARCHIVED') {
                        secondaryActions.push(
                            <SecondaryButton key="download" size="small" icon={Download} className="flex-1 justify-center" onClick={handleDownload}>Download</SecondaryButton>
                        );
                    }
                } else {
                    secondaryActions.push(
                        <SecondaryButton key="view" size="small" icon={Eye} className="flex-1 justify-center" onClick={() => openViewer(document)}>View</SecondaryButton>
                    );
                    if (!document.is_archived && status !== 'ARCHIVED') {
                        secondaryActions.push(
                            <SecondaryButton key="download" size="small" icon={Download} className="flex-1 justify-center" onClick={handleDownload}>Download</SecondaryButton>
                        );
                    }
                }

                if (role === USERS_ROLE.ADMINISTRATOR || role === USERS_ROLE.COORDINATOR) {
                    if (!document.is_archived && status !== 'ARCHIVED') {
                        secondaryActions.push(
                            <SecondaryButton key="edit" size="small" icon={MessageSquare} className="flex-1 justify-center" onClick={handleEditOpen}>Edit</SecondaryButton>
                        );
                    }

                    if (status !== true && status !== 'ATTACHMENT' && !document.is_archived && status !== 'ARCHIVED') {
                        if (docShares.length === 0) {
                            primaryDestructiveActions.push(
                                <PrimaryButton key="share" size="small" icon={Share2} className="flex-1 justify-center" onClick={handleShareOpen}>Share</PrimaryButton>
                            );
                        } else {
                            primaryDestructiveActions.push(
                                <DestructiveButton key="unshare" size="small" icon={XCircle} className="flex-1 justify-center" onClick={() => setDestructiveAction('UNSHARE')}>Unshare</DestructiveButton>
                            );
                        }
                    }

                    if (!document.is_archived && (docShares.length === 0 || status === 'ATTACHMENT')) {
                        primaryDestructiveActions.push(
                            <DestructiveButton key="archive" size="small" icon={Archive} className="flex-1 justify-center" onClick={() => setDestructiveAction('ARCHIVE')}>Archive</DestructiveButton>
                        );
                    } else if (document.is_archived) {
                        primaryDestructiveActions.push(
                            <PrimaryButton key="unarchive" size="small" icon={RotateCcw} className="flex-1 justify-center" onClick={() => setDestructiveAction('UNARCHIVE')}>Unarchive</PrimaryButton>,
                            <DestructiveButton key="delete" size="small" icon={XCircle} className="flex-1 justify-center" onClick={() => setDestructiveAction('DELETE')}>Delete</DestructiveButton>
                        );
                    }
                } else if (role === USERS_ROLE.OFFICER) {
                    if (status === DOCUMENT_SHARE_STATUS.PENDING_APPROVAL) {
                        primaryDestructiveActions.push(
                            <PrimaryButton key="approve" size="small" icon={CheckCircle} className="flex-1 justify-center" onClick={() => setIsApproveModalOpen(true)}>Approve</PrimaryButton>,
                            <DestructiveButton key="reject" size="small" icon={XCircle} className="flex-1 justify-center" onClick={() => setDestructiveAction('REJECT')}>Reject</DestructiveButton>
                        );
                    } else if (status === DOCUMENT_SHARE_STATUS.APPROVED) {
                        primaryDestructiveActions.push(
                            <DestructiveButton key="unapprove" size="small" icon={XCircle} className="flex-1 justify-center" onClick={() => setDestructiveAction('UNAPPROVE')}>Unapprove</DestructiveButton>
                        );
                    }
                } else if (role === USERS_ROLE.DIRECTOR) {
                    if (status === DOCUMENT_SHARE_STATUS.APPROVED) {
                        primaryDestructiveActions.push(
                            <PrimaryButton key="publish" size="small" icon={UploadCloud} className="flex-1 justify-center" onClick={handlePublishOpen}>Publish</PrimaryButton>,
                            <DestructiveButton key="stash" size="small" icon={Archive} className="flex-1 justify-center" onClick={() => setDestructiveAction('STASH')}>Stash</DestructiveButton>
                        );
                    } else if (status === DOCUMENT_SHARE_STATUS.PUBLISHED) {
                        primaryDestructiveActions.push(
                            <DestructiveButton key="unpublish" size="small" icon={EyeOff} className="flex-1 justify-center" onClick={() => setDestructiveAction('UNPUBLISH')}>Unpublish</DestructiveButton>
                        );
                    }
                }

                if (secondaryActions.length === 0 && primaryDestructiveActions.length === 0) return null;

                return (
                    <div className="mt-auto border-t border-border bg-surface p-4">
                        <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-muted">Actions</span>
                        <div className="flex flex-col gap-2">
                            {secondaryActions.length > 0 && (
                                <div className="flex gap-2">
                                    {secondaryActions}
                                </div>
                            )}
                            {primaryDestructiveActions.length > 0 && (
                                <div className="flex gap-2">
                                    {primaryDestructiveActions}
                                </div>
                            )}
                        </div>
                    </div>
                );
            };

            return (
                <aside className="flex w-100 shrink-0 flex-col border-l border-border bg-surface">
                    {/* --- Header --- */}
                    <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
                        <h2 className="text-sm font-bold text-main">Inspector</h2>
                        <IconButton icon={X} onClick={onClose} />
                    </div>

                    {/* --- Body --- */}
                    {document ? (
                        <div className="flex flex-1 flex-col overflow-hidden">
                            {/* --- Identity --- */}
                            <div className="flex flex-col items-center gap-3 border-b border-border p-6 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-hover text-accent">
                                    {getFileIcon(document.is_folder, latestVersion?.mime_type)}
                                </div>
                                <div>
                                    <p className="break-all text-sm font-bold text-main">{document.name}</p>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{computedStatus.replace(/_/g, ' ')}</p>
                                </div>
                            </div>

                            {/* --- Tabs --- */}
                            <div className="flex border-b border-border">
                                <button
                                    className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeTab === INSPECTOR_TABS.METADATA ? 'border-b-2 border-accent text-accent' : 'text-muted hover:text-main'}`}
                                    onClick={() => setActiveTab(INSPECTOR_TABS.METADATA)}
                                >
                                    Metadata
                                </button>
                                {!document.is_folder && (
                                    <button
                                        className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeTab === INSPECTOR_TABS.VERSIONS ? 'border-b-2 border-accent text-accent' : 'text-muted hover:text-main'}`}
                                        onClick={() => setActiveTab(INSPECTOR_TABS.VERSIONS)}
                                    >
                                        Versions ({docVersions.length})
                                    </button>
                                )}
                            </div>

                            {/* --- Tab Content --- */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {activeTab === INSPECTOR_TABS.METADATA || document.is_folder ? (
                                    <div className="flex flex-col gap-6">
                                        {/* Status */}
                                        <div>
                                            <div className="flex items-center gap-1.5 text-muted">
                                                <Tag className="size-3.5" />
                                                <span className="text-xs font-bold uppercase tracking-wide">Status</span>
                                            </div>
                                            <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                                {computedStatus.replace(/_/g, ' ')}
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        {document.summary && (
                                            <div>
                                                <div className="flex items-center gap-1.5 text-muted">
                                                    <Sparkles className="size-3.5" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Summary</span>
                                                </div>
                                                <div className="mt-2 rounded bg-surface-hover p-2 text-sm leading-relaxed text-main">
                                                    {document.summary}
                                                </div>
                                            </div>
                                        )}

                                        {/* Comment */}
                                        {document.comment && (
                                            <div>
                                                <div className="flex items-center gap-1.5 text-muted">
                                                    <MessageSquare className="size-3.5" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Comment</span>
                                                </div>
                                                <div className="mt-2 rounded bg-surface-hover p-2 text-sm leading-relaxed text-main">
                                                    {document.comment}
                                                </div>
                                            </div>
                                        )}

                                        {/* File Details */}
                                        {latestVersion && (
                                            <div>
                                                <div className="flex items-center gap-1.5 text-muted">
                                                    <FileText className="size-3.5" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">File Details</span>
                                                </div>
                                                <div className="mt-2 flex flex-col gap-3 rounded bg-surface-hover p-2 text-sm text-main">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted">Size</span>
                                                        <span className="font-medium">{formatBytes(latestVersion.size_bytes)}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted">Type</span>
                                                        <span className="break-words font-medium">{latestVersion.mime_type}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted">Storage Path</span>
                                                        <span className="break-words font-mono text-sm text-main">{latestVersion.path}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actors & Sharing */}
                                        <div>
                                            <div className="flex items-center gap-1.5 text-muted">
                                                <Users className="size-3.5" />
                                                <span className="text-xs font-bold uppercase tracking-wide">Actors & Sharing</span>
                                            </div>
                                            <div className="mt-2 flex flex-col gap-3 rounded bg-surface-hover p-2 text-sm text-main">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted">Author / Uploader</span>
                                                    <span className="truncate font-medium">
                                                        {(() => {
                                                            const u = users.find(u => u.id === document.uploader_id);
                                                            return u ? (u.id === user.id ? 'Me' : `${u.first_name} ${u.last_name}`) : 'Unknown';
                                                        })()}
                                                    </span>
                                                </div>

                                                {(computedStatus === DOCUMENT_SHARE_STATUS.PUBLISHED || computedStatus === DOCUMENT_SHARE_STATUS.APPROVED) && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted">Approved By</span>
                                                        <span className="truncate font-medium">
                                                            {(() => {
                                                                const approverId = latestVersion?.approver_id;
                                                                if (!approverId) return <span className="italic text-muted">System</span>;
                                                                const u = users.find(u => u.id === approverId);
                                                                return u ? (u.id === user.id ? 'Me' : `${u.first_name} ${u.last_name}`) : <span className="italic text-muted">System</span>;
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}

                                                {computedStatus === DOCUMENT_SHARE_STATUS.PUBLISHED && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted">Published By</span>
                                                        <span className="truncate font-medium">
                                                            {(() => {
                                                                const publisherId = latestVersion?.publisher_id;
                                                                if (!publisherId) return <span className="italic text-muted">System</span>;
                                                                const u = users.find(u => u.id === publisherId);
                                                                return u ? (u.id === user.id ? 'Me' : `${u.first_name} ${u.last_name}`) : <span className="italic text-muted">System</span>;
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}

                                                {(docShares.length > 0 || docAttachments.length > 0) && (
                                                    <>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted">Shared By</span>
                                                            <span className="truncate font-medium">
                                                                {Array.from(new Set([...docShares.map(ds => ds.sharer_id), ...docAttachments.map(da => da.attached_by_id)])).map(id => {
                                                                    const u = users.find(u => u.id === id);
                                                                    return u ? (u.id === user.id ? 'Me' : `${u.first_name} ${u.last_name}`) : 'Unknown';
                                                                }).join(', ')}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted">Shared With</span>
                                                            <span className="flex flex-col font-medium">
                                                                {docShares.map(share => {
                                                                    const dept = departments.find(d => d.id === share.department_id);
                                                                    const u = users.find(u => u.id === share.recipient_id);
                                                                    const deptLabel = dept ? dept.name : (share.department_id || 'Unknown');
                                                                    const userLabel = u ? (u.id === user.id ? 'Me' : `${u.first_name} ${u.last_name}`) : 'Everyone';

                                                                    return (
                                                                        <span key={share.id} className="truncate">
                                                                            {share.department_id ? deptLabel : ''}
                                                                            {share.department_id && computedStatus === DOCUMENT_SHARE_STATUS.PUBLISHED ? ' => ' : ''}
                                                                            {computedStatus === DOCUMENT_SHARE_STATUS.PUBLISHED ? userLabel : ''}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {docAttachments.map(att => {
                                                                    const req = documentRequests.find(r => r.id === att.document_request_id);
                                                                    const u = users.find(u => u.id === req?.requester_id);
                                                                    const label = u ? (u.id === user.id ? 'Me' : `${u.first_name} ${u.last_name}`) : 'Ticket Attachment';
                                                                    return (
                                                                        <span key={`att-${att.id}`} className="truncate">
                                                                            {label}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div>
                                            <div className="flex items-center gap-1.5 text-muted">
                                                <Calendar className="size-3.5" />
                                                <span className="text-xs font-bold uppercase tracking-wide">Dates</span>
                                            </div>
                                            <div className="mt-2 flex flex-col gap-2 rounded bg-surface-hover p-2 text-sm text-main">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted">Created</span>
                                                    <span className="font-medium">{new Date(document.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted">Modified</span>
                                                    <span className="font-medium">{new Date(document.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {/* Revert — Admin/Coordinator */}
                                        {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && activeVersionId && (
                                            <div className="mb-2">
                                                <SecondaryButton size="small" icon={RotateCcw} className="w-full justify-center text-accent" onClick={() => setIsRevertModalOpen(true)}>
                                                    Revert to Selected Version
                                                </SecondaryButton>
                                            </div>
                                        )}
                                        {docVersions.length > 0 ? (
                                            docVersions.map((v, index) => {
                                                const isCurrent = index === 0;
                                                const isSelected = activeVersionId === v.id;
                                                const canSelectVersion = user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR;

                                                const pointerClass = (canSelectVersion && !isCurrent) ? 'cursor-pointer hover:border-accent' : '';
                                                const stateClass = isCurrent
                                                    ? 'border-border bg-surface'
                                                    : (isSelected ? 'border-accent bg-background ring-1 ring-accent' : 'border-border bg-surface-hover');

                                                return (
                                                    <div
                                                        key={v.id}
                                                        className={`flex flex-col gap-2 rounded-md border p-3 shadow-sm transition-colors ${stateClass} ${pointerClass}`}
                                                        onClick={() => !isCurrent && canSelectVersion && setActiveVersionId(isSelected ? null : v.id)}
                                                    >
                                                        <div className="flex items-center justify-between border-b border-border pb-2">
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm font-bold ${isSelected ? 'text-accent' : 'text-main'}`}>
                                                                    Version {v.version}
                                                                </span>
                                                                {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Current Version</span>}
                                                            </div>
                                                            <span className="text-xs font-medium text-muted">{new Date(v.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted">Size</span>
                                                            <span className="font-medium">{formatBytes(v.size_bytes)}</span>
                                                        </div>
                                                        {v.change_summary && (
                                                            <div className="mt-1 flex items-start gap-2 rounded bg-background p-2 text-xs text-main">
                                                                <Sparkles className="mt-0.5 size-3 shrink-0" />
                                                                <p className="break-words leading-relaxed">{v.change_summary}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-center text-sm text-muted">No versions available.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* --- Role Based Actions --- */}
                            {renderActions()}
                        </div>
                    ) : auditLog ? (
                        <div className="flex flex-1 flex-col overflow-hidden">
                            {/* --- Identity --- */}
                            <div className="flex flex-col items-center gap-3 border-b border-border p-6 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-hover text-accent">
                                    <Activity className="size-8" />
                                </div>
                                <div>
                                    <p className="break-all text-sm font-bold text-main">{auditLog.action.replace(/_/g, ' ')}</p>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">
                                        {auditLog.entity_type.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>

                            {/* --- Tabs --- */}
                            <div className="flex border-b border-border">
                                <button
                                    className="flex-1 border-b-2 border-accent py-3 text-xs font-bold uppercase text-accent transition-colors"
                                >
                                    Metadata
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <Tag className="size-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wide">Entity Type</span>
                                        </div>
                                        <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                            {auditLog.entity_type.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <Activity className="size-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wide">Action</span>
                                        </div>
                                        <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                            {auditLog.action.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <User className="size-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wide">Actor</span>
                                        </div>
                                        <div className="mt-2 break-words rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                            {(() => {
                                                if (!auditLog.actor_id) return 'System';
                                                const actor = users.find(u => u.id === auditLog.actor_id);
                                                return actor ? `${actor.first_name} ${actor.last_name}` : 'Unknown User';
                                            })()}
                                        </div>
                                    </div>

                                    {/* Additional Data */}
                                    {auditLog.data && Object.keys(auditLog.data).length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-1.5 text-muted">
                                                <FileText className="size-3.5" />
                                                <span className="text-xs font-bold uppercase tracking-wide">Additional Data</span>
                                            </div>
                                            <div className="mt-2 flex flex-col gap-3 rounded bg-surface-hover p-2 text-sm text-main">
                                                {Object.entries(auditLog.data).map(([key, value]) => {
                                                    const formattedKey = key.replace(/_/g, ' ').toUpperCase();

                                                    let displayValue;
                                                    if (key === 'size_bytes' && typeof value === 'number') {
                                                        displayValue = <span className="break-words font-medium">{formatBytes(value)}</span>;
                                                    } else if (typeof value === 'object' && value !== null) {
                                                        displayValue = (
                                                            <div className="mt-1 flex flex-col gap-1">
                                                                {Object.values(value).map((subValue, idx) => {
                                                                    if (typeof subValue === 'object' && subValue !== null) {
                                                                        // Handle the 'old' / 'new' change pattern
                                                                        if ('old' in subValue || 'new' in subValue) {
                                                                            const oldVal = subValue.old !== undefined ? String(subValue.old) : 'null';
                                                                            const newVal = subValue.new !== undefined ? String(subValue.new) : 'null';
                                                                            return (
                                                                                <div key={idx} className="flex gap-2">
                                                                                    <span className="break-words text-sm font-medium">
                                                                                        {oldVal} <span className="mx-1 text-muted">=&gt;</span> {newVal}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        // Fallback for other nested objects
                                                                        return Object.entries(subValue).map(([innerKey, innerValue]) => {
                                                                            const formattedInnerKey = innerKey.charAt(0).toUpperCase() + innerKey.slice(1).replace(/_/g, ' ');
                                                                            return (
                                                                                <div key={`${idx}-${innerKey}`} className="flex gap-2">
                                                                                    <span className="text-xs font-semibold text-muted">{formattedInnerKey} :</span>
                                                                                    <span className="break-words text-sm font-medium">{String(innerValue)}</span>
                                                                                </div>
                                                                            );
                                                                        });
                                                                    }
                                                                    return <span key={idx} className="break-words text-sm font-medium">{String(subValue)}</span>;
                                                                })}
                                                            </div>
                                                        );
                                                    } else {
                                                        displayValue = <span className="break-words font-medium">{String(value)}</span>;
                                                    }

                                                    return (
                                                        <div key={key} className="flex flex-col">
                                                            <span className="text-xs text-muted">{formattedKey}</span>
                                                            {displayValue}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex flex-col gap-6">
                                    {/* Timestamp */}
                                    <div>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <Calendar className="size-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wide">Timestamp</span>
                                        </div>
                                        <div className="mt-2 rounded bg-surface-hover p-2 text-sm text-main">
                                            {new Date(auditLog.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
                            <FileText className="size-10 text-border" />
                            <p className="text-sm text-muted">Select a document or audit log to view its details here.</p>
                        </div>
                    )}

                    {/* --- Modals --- */}

                    <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Document`} className={`w-full ${docShares.length > 0 ? 'max-w-4xl' : 'max-w-xl'}`}>
                        <div className={`grid ${docShares.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-6 p-6`}>
                            {/* Left Pane: Document Attributes */}
                            <div className={`flex flex-col gap-6 ${docShares.length > 0 ? 'border-r border-border pr-6' : ''}`}>
                                {editError && (
                                    <div className="rounded border border-error/50 bg-error/10 p-3 text-sm text-error">
                                        {editError}
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-main">Name</label>
                                    <InputField
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-main">Comment (Optional)</label>
                                    <TextArea
                                        placeholder="Add any instructions or remarks..."
                                        rows={4}
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Right Pane: Share Selection (Conditional based on status) */}
                            {docShares.length > 0 && (
                                <div className="flex flex-col gap-6 border-border pl-0">
                                    {computedStatus === 'UPLOADED' || computedStatus === DOCUMENT_SHARE_STATUS.PENDING_APPROVAL || computedStatus === DOCUMENT_SHARE_STATUS.APPROVED ? (
                                        <div className="flex flex-col gap-3 h-full">
                                            <label className="text-sm font-semibold text-main">Manage Shared Departments</label>
                                            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-hover p-3 flex-1 max-h-[400px]">
                                                <div className="flex gap-2">
                                                    <InputField
                                                        className="flex-1"
                                                        leftIcon={Search}
                                                        placeholder="Search departments..."
                                                        value={departmentSearch}
                                                        onChange={(e) => setDepartmentSearch(e.target.value)}
                                                    />
                                                    <SecondaryButton onClick={toggleAllDepartments}>
                                                        {shareDepartmentIds.length === departments.length ? 'None' : 'All'}
                                                    </SecondaryButton>
                                                </div>
                                                <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                                                    {departments.filter(d => d.name.toLowerCase().includes(departmentSearch.toLowerCase())).map(dept => {
                                                        const isSelected = shareDepartmentIds.includes(dept.id);
                                                        return (
                                                            <button
                                                                key={dept.id}
                                                                type="button"
                                                                onClick={() => toggleDepartment(dept.id)}
                                                                className={`flex cursor-pointer items-center justify-between rounded-md border p-2.5 text-left transition-colors ${isSelected ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-main hover:bg-surface-hover'}`}
                                                            >
                                                                <span className="text-sm font-medium">{dept.name}</span>
                                                                {isSelected && <CheckCircle className="size-4" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : computedStatus === DOCUMENT_SHARE_STATUS.PUBLISHED ? (
                                        <div className="flex flex-col gap-3 h-full">
                                            <label className="text-sm font-semibold text-main">Manage Published Users</label>
                                            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-hover p-3 flex-1 max-h-[400px]">
                                                <div className="flex gap-2">
                                                    <InputField
                                                        className="flex-1"
                                                        leftIcon={Search}
                                                        placeholder="Search users..."
                                                        value={userSearch}
                                                        onChange={(e) => setUserSearch(e.target.value)}
                                                    />
                                                    <SecondaryButton onClick={toggleAllUsers}>
                                                        {publishUserIds.includes('ALL_USERS') ? 'None' : 'All'}
                                                    </SecondaryButton>
                                                </div>
                                                <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                                                    {eligibleUsers.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase())).map(u => {
                                                        const isSelected = publishUserIds.includes('ALL_USERS') || publishUserIds.includes(u.id);
                                                        return (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => toggleUser(u.id)}
                                                                className={`flex cursor-pointer items-center justify-between rounded-md border p-2.5 transition-colors ${isSelected ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-main hover:bg-surface-hover'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <img src={u.avatar_path || DefaultAvatar} alt="Avatar" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border" />
                                                                    <div className="flex flex-col text-left">
                                                                        <span className="text-sm font-medium leading-tight">{u.first_name} {u.last_name}</span>
                                                                        <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-accent/70' : 'text-muted'}`}>
                                                                            {u.role.replace('_', ' ')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {isSelected && <CheckCircle className="size-4 shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
                                            <Share2 className="size-10 text-border" />
                                            <p className="text-sm text-muted">Share settings are not available for this document status.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {docShares.length === 0 && (
                                <div className="mt-auto flex justify-end gap-3 pt-4">
                                    <SecondaryButton onClick={() => setIsEditModalOpen(false)}>Cancel</SecondaryButton>
                                    <PrimaryButton onClick={handleEditSubmit}>Save Changes</PrimaryButton>
                                </div>
                            )}
                        </div>
                        {docShares.length > 0 && (
                            <div className="mt-auto flex justify-end gap-3 p-6 pt-0">
                                <SecondaryButton onClick={() => setIsEditModalOpen(false)}>Cancel</SecondaryButton>
                                <PrimaryButton onClick={handleEditSubmit}>Save Changes</PrimaryButton>
                            </div>
                        )}
                    </Modal>

                    <ConfirmActionModal
                        isOpen={isRevertModalOpen}
                        onClose={() => setIsRevertModalOpen(false)}
                        title="Confirm Revert"
                        description={`Are you sure you want to revert ${document?.name} to the selected version? This action will set the selected version as the active one.`}
                        confirmText="Confirm Revert"
                        onConfirm={handleRevertSubmit}
                        isDestructive={false}
                    />



                    <ConfirmActionModal
                        isOpen={isApproveModalOpen}
                        onClose={() => setIsApproveModalOpen(false)}
                        title="Confirm Approval"
                        description={`Are you sure you want to approve ${document?.name}? This will forward the document to the Director for publication.`}
                        confirmText="Confirm Approval"
                        onConfirm={handleApproveSubmit}
                        isDestructive={false}
                    />

                    <ConfirmActionModal
                        isOpen={!!destructiveAction}
                        onClose={() => setDestructiveAction(null)}
                        title={`Confirm ${destructiveAction === 'REJECT' ? 'Rejection' : destructiveAction?.charAt(0) + destructiveAction?.slice(1).toLowerCase()}`}
                        description={`Are you sure you want to ${destructiveAction?.toLowerCase()} ${document?.name}?`}
                        confirmText={`Confirm`}
                        onConfirm={handleDestructiveSubmit}
                        isDestructive={true}
                    />

                    <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={`Share Document`} className="w-full max-w-4xl">
                        <div className="grid grid-cols-2 gap-6 p-6">
                            {/* Left Pane: Document Attributes */}
                            <div className="flex flex-col gap-6 border-r border-border pr-6">
                                <div>
                                    <h3 className="text-lg font-bold text-main">{document?.name}</h3>
                                    <p className="mt-1 text-sm text-muted">Review the document details before sharing.</p>
                                </div>
                                <div className="flex flex-col gap-3 rounded bg-surface-hover p-4 text-sm text-main">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Size</span>
                                        <span className="font-medium">{latestVersion ? formatBytes(latestVersion.size_bytes) : 'Unknown'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Type</span>
                                        <span className="break-words font-medium">{latestVersion?.mime_type || 'Unknown'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Storage Path</span>
                                        <span className="break-words font-mono text-sm font-medium">{latestVersion?.path || 'Unknown'}</span>
                                    </div>
                                    {document?.summary && (
                                        <div className="flex flex-col border-t border-border">
                                            <span className="text-xs text-muted">Summary</span>
                                            <span className="text-sm font-medium leading-relaxed">{document.summary}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-main">Will be shared with:</span>
                                    {shareDepartmentIds.length > 0 ? (
                                        <ul className="list-inside list-disc text-sm text-main">
                                            {shareDepartmentIds.slice(0, 5).map(id => {
                                                const dept = departments.find(d => d.id === id);
                                                return <li key={id}>{dept?.name || id}</li>;
                                            })}
                                            {shareDepartmentIds.length > 5 && (
                                                <li className="italic text-muted mt-1">and {shareDepartmentIds.length - 5} others...</li>
                                            )}
                                        </ul>
                                    ) : (
                                        <span className="text-sm italic text-muted">No departments selected yet.</span>
                                    )}
                                </div>
                            </div>

                            {/* Right Pane: Department Selection & Comment */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-semibold text-main">Select Departments</label>

                                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-hover p-3">
                                        <div className="flex gap-2">
                                            <InputField
                                                className="flex-1"
                                                leftIcon={Search}
                                                placeholder="Search departments..."
                                                value={departmentSearch}
                                                onChange={(e) => setDepartmentSearch(e.target.value)}
                                            />
                                            <SecondaryButton onClick={toggleAllDepartments}>
                                                {shareDepartmentIds.length === departments.length ? 'None' : 'All'}
                                            </SecondaryButton>
                                        </div>

                                        <div className="flex h-56 flex-col gap-2 overflow-y-auto pr-1">
                                            {departments.filter(d => d.name.toLowerCase().includes(departmentSearch.toLowerCase())).map(dept => {
                                                const isSelected = shareDepartmentIds.includes(dept.id);
                                                return (
                                                    <button
                                                        key={dept.id}
                                                        type="button"
                                                        onClick={() => toggleDepartment(dept.id)}
                                                        className={`flex cursor-pointer items-center justify-between rounded-md border p-2.5 text-left transition-colors ${isSelected ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-main hover:bg-surface-hover'}`}
                                                    >
                                                        <span className="text-sm font-medium">{dept.name}</span>
                                                        {isSelected && <CheckCircle className="size-4" />}
                                                    </button>
                                                );
                                            })}
                                            {departments.filter(d => d.name.toLowerCase().includes(departmentSearch.toLowerCase())).length === 0 && (
                                                <div className="py-4 text-center text-sm italic text-muted">No departments found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-main">Comment (Optional)</label>
                                    <TextArea
                                        placeholder="Add any instructions or remarks..."
                                        rows={4}
                                        value={shareComment}
                                        onChange={(e) => setShareComment(e.target.value)}
                                    />
                                </div>

                                <div className="mt-auto flex justify-end gap-3 pt-4">
                                    <SecondaryButton onClick={() => setIsShareModalOpen(false)}>Cancel</SecondaryButton>
                                    <PrimaryButton onClick={handleShareSubmit} disabled={shareDepartmentIds.length === 0}>Share Document</PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </Modal>

                    <Modal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} title={`Publish Document`} className="w-full max-w-4xl">
                        <div className="grid grid-cols-2 gap-6 p-6">
                            {/* Left Pane: Document Attributes */}
                            <div className="flex flex-col gap-6 border-r border-border pr-6">
                                <div>
                                    <h3 className="text-lg font-bold text-main">{document?.name}</h3>
                                    <p className="mt-1 text-sm text-muted">Review the document details before publishing.</p>
                                </div>
                                <div className="flex flex-col gap-3 rounded bg-surface-hover p-4 text-sm text-main">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Size</span>
                                        <span className="font-medium">{latestVersion ? formatBytes(latestVersion.size_bytes) : 'Unknown'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Type</span>
                                        <span className="break-words font-medium">{latestVersion?.mime_type || 'Unknown'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Storage Path</span>
                                        <span className="break-words font-mono text-sm font-medium">{latestVersion?.path || 'Unknown'}</span>
                                    </div>
                                    {document?.summary && (
                                        <div className="flex flex-col border-t border-border pt-3">
                                            <span className="mb-1 text-xs text-muted">Summary</span>
                                            <span className="text-sm font-medium leading-relaxed">{document.summary}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-main">Will be published to:</span>
                                    {publishUserIds.length > 0 ? (
                                        <ul className="list-inside list-disc text-sm text-main">
                                            {publishUserIds.includes('ALL_USERS') ? (
                                                <li>Everyone in the Department</li>
                                            ) : (
                                                <>
                                                    {publishUserIds.slice(0, 5).map(id => {
                                                        const u = users.find(u => u.id === id);
                                                        return <li key={id}>{u ? `${u.first_name} ${u.last_name}` : id}</li>;
                                                    })}
                                                    {publishUserIds.length > 5 && (
                                                        <li className="italic text-muted mt-1">and {publishUserIds.length - 5} others...</li>
                                                    )}
                                                </>
                                            )}
                                        </ul>
                                    ) : (
                                        <span className="text-sm italic text-muted">No users selected yet.</span>
                                    )}
                                </div>
                            </div>

                            {/* Right Pane: User Selection & Comment */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-semibold text-main">Select Users</label>

                                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-hover p-3">
                                        <div className="flex gap-2">
                                            <InputField
                                                className="flex-1"
                                                leftIcon={Search}
                                                placeholder="Search users..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                            />
                                            <SecondaryButton onClick={toggleAllUsers}>
                                                {publishUserIds.includes('ALL_USERS') ? 'None' : 'All'}
                                            </SecondaryButton>
                                        </div>

                                        <div className="flex h-56 flex-col gap-2 overflow-y-auto pr-1">
                                            {eligibleUsers.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase())).map(u => {
                                                const isSelected = publishUserIds.includes('ALL_USERS') || publishUserIds.includes(u.id);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => toggleUser(u.id)}
                                                        className={`flex cursor-pointer items-center justify-between rounded-md border p-2.5 transition-colors ${isSelected ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-main hover:bg-surface-hover'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img src={u.avatar_path || DefaultAvatar} alt="Avatar" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border" />
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-sm font-medium leading-tight">{u.first_name} {u.last_name}</span>
                                                                <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-accent/70' : 'text-muted'}`}>
                                                                    {u.role.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isSelected && <CheckCircle className="size-4 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                            {eligibleUsers.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                                                <div className="py-4 text-center text-sm italic text-muted">No users found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-main">Comment (Optional)</label>
                                    <TextArea
                                        placeholder="Add any instructions or remarks..."
                                        rows={4}
                                        value={publishComment}
                                        onChange={(e) => setPublishComment(e.target.value)}
                                    />
                                </div>

                                <div className="mt-auto flex justify-end gap-3 pt-4">
                                    <SecondaryButton onClick={() => setIsPublishModalOpen(false)}>Cancel</SecondaryButton>
                                    <PrimaryButton onClick={handlePublishSubmit} disabled={publishUserIds.length === 0}>Publish Document</PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </Modal>

                    {destructiveAction && (
                        <Modal isOpen={true} onClose={() => setDestructiveAction(null)} title={`Confirm ${destructiveAction.charAt(0) + destructiveAction.slice(1).toLowerCase()}`} className="w-full max-w-sm">
                            <div className="p-4 flex flex-col gap-4">
                                <p className="text-sm text-muted">
                                    Are you sure you want to {destructiveAction.toLowerCase()} <strong className="text-main">{document?.name}</strong>?
                                    {destructiveAction === 'REJECT' && ' This will return the document to the previous stage.'}
                                    {destructiveAction === 'UNSHARE' && ' This will revoke access for all departments.'}
                                    {destructiveAction === 'UNAPPROVE' && ' This will revoke your approval and return the document to pending.'}
                                    {destructiveAction === 'UNPUBLISH' && ' This will revoke access for all end users.'}
                                </p>
                                <div className="flex justify-end gap-3 pt-2">
                                    <SecondaryButton onClick={() => setDestructiveAction(null)}>Cancel</SecondaryButton>
                                    <DestructiveButton onClick={handleDestructiveSubmit}>Confirm</DestructiveButton>
                                </div>
                            </div>
                        </Modal>
                    )}
                </aside>
            );
        };

        export default Inspector;
