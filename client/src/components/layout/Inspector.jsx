import { useState, useMemo, useEffect } from 'react';
import {
    FileText, Sparkles, X, Building2, User,
    Share2, Archive, Eye, Download, MessageSquare, RotateCcw,
    CheckCircle, XCircle, UploadCloud, Tag, Calendar
} from 'lucide-react';
import { useAuthentication, useDocumentVersion, useDocumentShare, useUser, useDepartment } from '../../stores';
import { USERS_ROLE } from '../../constants';
import { IconButton, PrimaryButton, SecondaryButton, DestructiveButton, getFileIcon } from '../ui';

// Formatter for file size
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Inspector = ({ document, onClose }) => {
    const { user } = useAuthentication();
    const { documentVersions } = useDocumentVersion();
    const { documentShares } = useDocumentShare();
    const { users, getAll: getUsers } = useUser();
    const { departments, getAll: getDepartments } = useDepartment();

    const [activeTab, setActiveTab] = useState('METADATA'); // 'METADATA' | 'VERSIONS'
    const [activeVersionId, setActiveVersionId] = useState(null);

    useEffect(() => {
        if (users.length === 0) getUsers();
        if (departments.length === 0) getDepartments();
    }, [users.length, departments.length, getUsers, getDepartments]);

    // Reset active version when document changes
    useEffect(() => {
        setActiveVersionId(null);
    }, [document?.id]);

    // Get specific document details
    const docVersions = useMemo(() =>
        document ? documentVersions.filter(v => v.document_id === document.id).sort((a, b) => b.version - a.version) : []
        , [document, documentVersions]);

    const latestVersion = docVersions[0];

    const docShares = useMemo(() =>
        document ? documentShares.filter(s => s.document_id === document.id) : []
        , [document, documentShares]);

    // Role-based actions generator
    const renderActions = () => {
        if (!user || !document) return null;

        const role = user.role;
        const secondaryActions = [];
        const primaryDestructiveActions = [];

        // Base actions for all
        secondaryActions.push(
            <SecondaryButton key="view" size="small" icon={Eye} className="flex-1 justify-center">View</SecondaryButton>,
            <SecondaryButton key="download" size="small" icon={Download} className="flex-1 justify-center">Download</SecondaryButton>
        );

        if (role === USERS_ROLE.ADMINISTRATOR || role === USERS_ROLE.COORDINATOR) {
            secondaryActions.push(
                <SecondaryButton key="comment" size="small" icon={MessageSquare} className="flex-1 justify-center">Comment</SecondaryButton>
            );
            primaryDestructiveActions.push(
                <PrimaryButton key="share" size="small" icon={Share2} className="flex-1 justify-center">Share</PrimaryButton>,
                <DestructiveButton key="archive" size="small" icon={Archive} className="flex-1 justify-center">Archive</DestructiveButton>
            );
        } else if (role === USERS_ROLE.OFFICER) {
            primaryDestructiveActions.push(
                <PrimaryButton key="approve" size="small" icon={CheckCircle} className="flex-1 justify-center">Approve</PrimaryButton>,
                <DestructiveButton key="reject" size="small" icon={XCircle} className="flex-1 justify-center">Reject</DestructiveButton>
            );
        } else if (role === USERS_ROLE.DIRECTOR) {
            primaryDestructiveActions.push(
                <PrimaryButton key="publish" size="small" icon={UploadCloud} className="flex-1 justify-center">Publish</PrimaryButton>,
                <DestructiveButton key="reject" size="small" icon={XCircle} className="flex-1 justify-center">Reject</DestructiveButton>
            );
        }

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
                        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-hover text-muted">
                            {getFileIcon(document.is_folder, latestVersion?.mime_type)}
                        </div>
                        <div>
                            <p className="break-all text-sm font-bold text-main">{document.name}</p>
                            <p className="mt-1 text-xs text-muted">{latestVersion?.mime_type || (document.is_folder ? 'Folder' : 'File')}</p>
                        </div>
                    </div>

                    {/* --- Tabs --- */}
                    <div className="flex border-b border-border">
                        <button
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'METADATA' ? 'border-b-2 border-accent text-accent' : 'text-muted hover:text-main'}`}
                            onClick={() => setActiveTab('METADATA')}
                        >
                            Metadata
                        </button>
                        <button
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'VERSIONS' ? 'border-b-2 border-accent text-accent' : 'text-muted hover:text-main'}`}
                            onClick={() => setActiveTab('VERSIONS')}
                        >
                            Versions ({docVersions.length})
                        </button>
                    </div>

                    {/* --- Tab Content --- */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'METADATA' ? (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <div className="flex items-center gap-1.5 text-muted">
                                        <Tag className="size-3.5" />
                                        <span className="text-xs font-semibold tracking-wide uppercase">Status</span>
                                    </div>
                                    <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                        {document.status.replace(/_/g, ' ')}
                                    </div>
                                </div>

                                {document.summary && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <Sparkles className="size-3.5" />
                                            <span className="text-xs font-semibold tracking-wide uppercase">Summary</span>
                                        </div>
                                        <div className="mt-2 rounded bg-surface-hover p-2 text-sm leading-relaxed text-main">
                                            {document.summary}
                                        </div>
                                    </div>
                                )}

                                {document.comment && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <MessageSquare className="size-3.5" />
                                            <span className="text-xs font-semibold tracking-wide uppercase">Comment</span>
                                        </div>
                                        <div className="mt-2 rounded bg-surface-hover p-2 text-sm leading-relaxed text-main">
                                            {document.comment}
                                        </div>
                                    </div>
                                )}

                                {latestVersion && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <FileText className="size-3.5" />
                                            <span className="text-xs font-semibold tracking-wide uppercase">File Details</span>
                                        </div>
                                        <div className="mt-2 flex flex-col gap-3 rounded bg-surface-hover p-2 text-sm text-main">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted">Size:</span>
                                                <span className="font-medium">{formatBytes(latestVersion.size_bytes)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted">Type:</span>
                                                <span className="font-medium break-words">{latestVersion.mime_type}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted">Storage Path:</span>
                                                <span className="break-words font-mono text-sm text-main">{latestVersion.path}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-1.5 text-muted">
                                        <Share2 className="size-3.5" />
                                        <span className="text-xs font-semibold tracking-wide uppercase">Shared With</span>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-3 rounded bg-surface-hover p-2 text-sm text-main">
                                        {docShares.length > 0 ? (
                                            docShares.map(share => {
                                                if (document.status === 'ATTACHMENT' || share.document_request_id) {
                                                    // Attachment pipeline
                                                    const u = users.find(u => u.id === share.recipient_id);
                                                    const label = u ? u.name : 'Ticket Attachment';
                                                    return (
                                                        <div key={share.id} className="flex flex-col">
                                                            <span className="text-xs text-muted">User</span>
                                                            <span className="truncate font-medium">{label}</span>
                                                        </div>
                                                    );
                                                } else {
                                                    // Normal pipeline
                                                    const dept = departments.find(d => d.id === share.department_id);
                                                    const u = users.find(u => u.id === share.recipient_id);

                                                    const deptLabel = dept ? dept.name : (share.department_id || 'Unknown');
                                                    const userLabel = u ? u.name : 'Everyone';

                                                    return (
                                                        <div key={share.id} className="flex flex-col gap-3">
                                                            {share.department_id && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-muted">Department</span>
                                                                    <span className="truncate font-medium">{deptLabel}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-muted">User</span>
                                                                <span className="truncate font-medium">{userLabel}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })
                                        ) : (
                                            <span className="text-muted italic">Not shared</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5 text-muted">
                                        <Calendar className="size-3.5" />
                                        <span className="text-xs font-semibold tracking-wide uppercase">Dates</span>
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
                                {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && activeVersionId && (
                                    <div className="mb-2">
                                        <SecondaryButton size="small" icon={RotateCcw} className="w-full justify-center text-accent">
                                            Revert to Selected Version
                                        </SecondaryButton>
                                    </div>
                                )}
                                {docVersions.length > 0 ? (
                                    docVersions.map((v, index) => {
                                        const isCurrent = index === 0;
                                        const isSelected = activeVersionId === v.id;

                                        return (
                                            <div
                                                key={v.id}
                                                className={`flex flex-col gap-2 rounded-md border p-3 shadow-sm transition-colors ${isCurrent ? 'border-border bg-surface' : (isSelected ? 'border-accent bg-background ring-1 ring-accent' : 'cursor-pointer border-border bg-surface-hover hover:border-accent')}`}
                                                onClick={() => !isCurrent && setActiveVersionId(v.id)}
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
                                                <div className="flex justify-between text-xs text-main">
                                                    <span className="text-muted">Size:</span>
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
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
                    <FileText className="size-10 text-border" />
                    <p className="text-sm text-muted">Select a document to view its details here.</p>
                </div>
            )}
        </aside>
    );
};

export default Inspector;
