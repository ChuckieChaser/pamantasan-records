import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FolderOpen,
    Archive,
    Bell,
    Search,
    PanelRightOpen,
    PanelRightClose,
    UserCircle,
    LogOut,
    Fingerprint,
    FileText,
    Folder,
    Loader2,
    X,
    Info,
    ShieldCheck,
    Clock,
    Share2,
    Activity,
    ShieldAlert,
    Ticket,
    Plus,
    Trash2,
    Edit,
    Check,
} from 'lucide-react';
// Settings icon removed as it is unused

// Importing directly from your established modules
import { DOCUMENTS_STATUS } from './constants';
import { useAuthentication, useDocument, useUser, useNotification, useDocumentShare, useCoordinatorRequest, useDocumentRequest, useAuditLog, useUserSetting } from './stores';

// ==============================================================================
// SECTION 1: FUNCTIONAL PAGES
// ==============================================================================

const LoginPage = () => {
    const { bypass, isAuthenticated, isLoading } = useAuthentication();

    if (isAuthenticated) return <Navigate to="/dashboard" replace />;

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-6 rounded-xl border border-border bg-surface p-10 shadow-lg">
                <div className="rounded-full bg-accent-background p-4 text-accent">
                    <Fingerprint size={48} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-main">System Access</h1>
                    <p className="mt-2 text-sm text-muted">Authenticate to access the workspace.</p>
                </div>
                <button onClick={() => bypass()} disabled={isLoading} className="flex w-full items-center justify-center space-x-2 rounded-lg bg-main px-4 py-3 text-surface transition-colors hover:bg-main/90 disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span>Authenticate as Admin</span>}
                </button>
            </div>
        </div>
    );
};

const RequestPage = () => {
    const { user } = useAuthentication();
    const { documentRequests, getByRequesterId, create: createRequest, update: updateRequest, delete: deleteRequest } = useDocumentRequest();
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ document_name: '', notes: '' });

    useEffect(() => {
        if (user?.id) getByRequesterId(user.id);
    }, [user?.id, getByRequesterId]);

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-2xl font-bold text-main">My Requests</h2>
                    <p className="mt-1 text-sm text-muted">Create and manage your document requests.</p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setForm({ document_name: '', notes: '' });
                    }}
                    className="inline-flex items-center space-x-2 rounded bg-main px-3 py-2 text-sm text-surface"
                >
                    <Plus size={14} />
                    <span>New Request</span>
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-hover text-muted">
                        <tr>
                            <th className="px-6 py-4 font-medium">Document</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {documentRequests.map((req) => (
                            <tr key={req.id} className="transition-colors hover:bg-surface-hover">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-main">{req.document_name}</span>
                                        <span className="text-xs text-muted">{req.notes}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{req.status}</td>
                                <td className="px-6 py-4">
                                    <div className="inline-flex items-center space-x-2">
                                        <button onClick={async () => await updateRequest(req.id, { status: req.status === 'OPEN' ? 'CLOSED' : 'OPEN' })} className="text-muted hover:text-main">
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Delete request?')) await deleteRequest(req.id);
                                            }}
                                            className="text-muted hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-[560px] rounded-lg bg-surface p-6">
                        <h3 className="mb-4 text-lg font-bold">Create Request</h3>
                        <div className="space-y-3">
                            <input value={form.document_name} onChange={(e) => setForm({ ...form, document_name: e.target.value })} placeholder="Document name" className="w-full rounded border px-3 py-2" />
                            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="w-full rounded border px-3 py-2" />
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setIsCreating(false)} className="rounded border px-3 py-2">
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        await createRequest({ ...form, requester_id: user.id });
                                        setIsCreating(false);
                                    }}
                                    className="rounded bg-main px-3 py-2 text-surface"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const DashboardPage = () => {
    // 1. Hooking into our global stores
    const { user } = useAuthentication();
    const { documents, getAll: getAllDocs, selectActiveDocument } = useDocument();
    const { documentShares, getByDepartmentId } = useDocumentShare();
    const { coordinatorRequests, getAll: getAllCoord } = useCoordinatorRequest();
    const { documentRequests, getAll: getAllDocReq } = useDocumentRequest();
    const { auditLogs, getAll: getAllAudits } = useAuditLog();

    // 2. Fetching all necessary data when the component loads
    useEffect(() => {
        getAllDocs();
        getAllCoord();
        getAllDocReq();
        getAllAudits();

        // Only fetch shares if the user belongs to a department
        if (user?.department_id) {
            getByDepartmentId(user.department_id);
        }
    }, [user, getAllDocs, getAllCoord, getAllDocReq, getAllAudits, getByDepartmentId]);

    // 3. Processing Data for the UI
    // A. "Quick Access" (Top 4 most recently updated documents)
    const recentDocuments = [...documents].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 4);

    // B. "Shared with my Department" (Mapping share records back to actual documents)
    const sharedDocIds = documentShares.map((share) => share.document_id);
    const sharedDocuments = documents.filter((doc) => sharedDocIds.includes(doc.id));

    // C. Calculating Metrics for the Overview section
    const pendingCoordCount = coordinatorRequests.filter((cr) => cr.status === 'PENDING').length;
    const openTicketsCount = documentRequests.filter((dr) => dr.status === 'OPEN').length;

    // D. "Recent Activity" (Top 5 most recent audit logs)
    const recentActivity = [...auditLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    return (
        <div className="flex flex-col space-y-8 p-8">
            {/* --- HEADER --- */}
            <div>
                <h2 className="font-heading text-2xl font-bold text-main">Welcome back, {user?.first_name || 'User'}</h2>
                <p className="mt-1 text-sm text-muted">Here is what is happening in your workspace today.</p>
            </div>

            {/* --- SECTION 1: QUICK ACCESS (GDRIVE STYLE) --- */}
            <div>
                <div className="mb-4 flex items-center space-x-2 text-main">
                    <Clock size={18} className="text-accent" />
                    <h3 className="font-heading text-lg font-bold">Quick Access</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {recentDocuments.map((doc) => (
                        <div
                            key={doc.id}
                            onClick={() => selectActiveDocument(doc.id)}
                            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-accent hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="rounded-lg bg-surface-hover p-2 text-muted transition-colors group-hover:bg-accent-background group-hover:text-accent">
                                    {doc.is_folder ? <Folder size={24} className="fill-current" /> : <FileText size={24} />}
                                </div>
                                <span className="inline-flex rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-semibold text-main uppercase">{doc.status.replace('_', ' ')}</span>
                            </div>
                            <div className="mt-4">
                                <p className="truncate font-medium text-main" title={doc.name}>
                                    {doc.name}
                                </p>
                                <p className="mt-1 text-xs text-muted">Modified {new Date(doc.updated_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION 2: METRICS OVERVIEW --- */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                    <div className="rounded-lg bg-surface-hover p-3 text-main">
                        <FolderOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted">Total Documents</p>
                        <h4 className="text-2xl font-bold text-main">{documents.length}</h4>
                    </div>
                </div>
                <div className="flex items-center space-x-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                    <div className="rounded-lg bg-warning-background p-3 text-warning-text">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted">Pending Approvals</p>
                        <h4 className="text-2xl font-bold text-main">{pendingCoordCount}</h4>
                    </div>
                </div>
                <div className="flex items-center space-x-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                    <div className="rounded-lg bg-error-background p-3 text-error-text">
                        <Ticket size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted">Open Helpdesk Tickets</p>
                        <h4 className="text-2xl font-bold text-main">{openTicketsCount}</h4>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: SPLIT VIEW (SHARED & ACTIVITY) --- */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Left Column: Shared With Me */}
                <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                    <div className="flex items-center space-x-2 border-b border-border bg-surface-hover p-4">
                        <Share2 size={18} className="text-muted" />
                        <h3 className="font-heading font-bold text-main">Shared with Department</h3>
                    </div>
                    <div className="divide-y divide-border">
                        {sharedDocuments.length > 0 ? (
                            sharedDocuments.map((doc) => (
                                <div key={doc.id} onClick={() => selectActiveDocument(doc.id)} className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-surface-hover">
                                    <div className="flex items-center space-x-3">
                                        <FileText size={18} className="text-muted" />
                                        <span className="text-sm font-medium text-main">{doc.name}</span>
                                    </div>
                                    <span className="text-xs text-muted">{new Date(doc.updated_at).toLocaleDateString()}</span>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-sm text-muted">No documents shared with your department yet.</div>
                        )}
                    </div>
                </div>

                {/* Right Column: Recent System Activity */}
                <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                    <div className="flex items-center space-x-2 border-b border-border bg-surface-hover p-4">
                        <Activity size={18} className="text-muted" />
                        <h3 className="font-heading font-bold text-main">System Activity</h3>
                    </div>
                    <div className="divide-y divide-border">
                        {recentActivity.map((log) => (
                            <div key={log.id} className="flex items-start space-x-3 p-4">
                                <div className="mt-0.5 rounded-full bg-surface-hover p-1.5 text-muted">
                                    <Activity size={12} />
                                </div>
                                <div>
                                    <p className="text-sm text-main">
                                        <span className="font-medium">{log.action}</span> on <span className="font-medium">{log.entity_type}</span>
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted">{new Date(log.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ManagementPage = () => {
    const { users, isLoading, getAll, create: createUser, update: updateUser } = useUser();
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', university_id: '', role: 'USER' });

    useEffect(() => {
        getAll();
    }, [getAll]);

    if (isLoading && users.length === 0)
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-2xl font-bold text-main">Management</h2>
                    <p className="mt-1 text-sm text-muted">Manage organizational personnel and access.</p>
                </div>
                <div>
                    <button onClick={() => setIsCreating(true)} className="inline-flex items-center space-x-2 rounded bg-main px-3 py-2 text-sm text-surface">
                        <Plus size={14} />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-hover text-muted">
                        <tr>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">University ID</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user.id} className="transition-colors hover:bg-surface-hover">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-main">
                                            {user.first_name} {user.last_name}
                                        </span>
                                        <span className="text-xs text-muted">{user.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-muted">{user.university_id}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-semibold text-main">{user.role}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-medium text-accent">{user.status.replace('_', ' ')}</span>
                                        <button onClick={() => updateUser(user.id, { status: user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE' })} className="text-muted hover:text-main">
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-[520px] rounded-lg bg-surface p-6">
                        <h3 className="mb-4 text-lg font-bold">Create User</h3>
                        <div className="space-y-3">
                            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" className="w-full rounded border px-3 py-2" />
                            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" className="w-full rounded border px-3 py-2" />
                            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded border px-3 py-2" />
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setIsCreating(false)} className="rounded border px-3 py-2">
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        await createUser(form);
                                        setIsCreating(false);
                                        setForm({ first_name: '', last_name: '', email: '', university_id: '', role: 'USER' });
                                    }}
                                    className="rounded bg-main px-3 py-2 text-surface"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DocumentsPage = () => {
    const { documents, isLoading, getAll, selectActiveDocument, activeDocument, create: createDocument, update: updateDocument, delete: deleteDocument } = useDocument();
    const [isCreating, setIsCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', is_folder: false, status: 'ACTIVE', summary: '' });

    useEffect(() => {
        getAll();
    }, [getAll]);

    // Filter out archived documents for the main workspace
    const activeWorkspaceDocs = documents.filter((doc) => doc.status !== DOCUMENTS_STATUS.ARCHIVED);

    if (isLoading && documents.length === 0)
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-2xl font-bold text-main">Workspace</h2>
                    <p className="mt-1 text-sm text-muted">Manage your documents, folders, and lifecycles.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => {
                            setIsCreating(true);
                            setEditing(null);
                            setForm({ name: '', is_folder: false, status: 'ACTIVE', summary: '' });
                        }}
                        className="inline-flex items-center space-x-2 rounded bg-main px-3 py-2 text-sm text-surface"
                    >
                        <Plus size={14} />
                        <span>New</span>
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-hover text-muted">
                        <tr>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Last Modified</th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {activeWorkspaceDocs.map((doc) => (
                            <tr key={doc.id} onClick={() => selectActiveDocument(doc.id)} className={`cursor-pointer transition-colors hover:bg-surface-hover ${activeDocument?.id === doc.id ? 'bg-accent-background' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-muted">{doc.is_folder ? <Folder size={20} className="fill-accent text-accent" /> : <FileText size={20} />}</div>
                                        <span className="font-medium text-main">{doc.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-semibold text-main">{doc.status.replace('_', ' ')}</span>
                                </td>
                                <td className="px-6 py-4 text-muted">{new Date(doc.updated_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditing(doc);
                                                setIsCreating(true);
                                                setForm({ name: doc.name, is_folder: doc.is_folder, status: doc.status, summary: doc.summary || '' });
                                            }}
                                            className="text-muted hover:text-main"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete this document?')) await deleteDocument(doc.id);
                                            }}
                                            className="text-muted hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-[560px] rounded-lg bg-surface p-6">
                        <h3 className="mb-4 text-lg font-bold">{editing ? 'Edit Document' : 'Create Document'}</h3>
                        <div className="space-y-3">
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Document name" className="w-full rounded border px-3 py-2" />
                            <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Summary" className="w-full rounded border px-3 py-2" />
                            <div className="flex items-center space-x-4">
                                <label className="inline-flex items-center space-x-2">
                                    <input type="checkbox" checked={form.is_folder} onChange={(e) => setForm({ ...form, is_folder: e.target.checked })} />
                                    <span className="text-sm">Folder</span>
                                </label>
                                <label className="inline-flex items-center space-x-2">
                                    <span className="text-sm">Status</span>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded border px-2 py-1">
                                        <option value="ACTIVE">Active</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setIsCreating(false)} className="rounded border px-3 py-2">
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (editing) {
                                            await updateDocument(editing.id, form);
                                        } else {
                                            await createDocument(form);
                                        }
                                        setIsCreating(false);
                                    }}
                                    className="rounded bg-main px-3 py-2 text-surface"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ArchivesPage = () => {
    const { documents, isLoading, getAll, selectActiveDocument, activeDocument } = useDocument();

    useEffect(() => {
        getAll();
    }, [getAll]);

    // Show only archived documents
    const archivedDocs = documents.filter((doc) => doc.status === DOCUMENTS_STATUS.ARCHIVED);

    if (isLoading && documents.length === 0)
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );

    return (
        <div className="p-8">
            <div className="mb-6">
                <h2 className="font-heading text-2xl font-bold text-main">Archives</h2>
                <p className="mt-1 text-sm text-muted">Historical and deprecated files.</p>
            </div>

            {archivedDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted">
                    <Archive size={48} className="mb-4 text-border" />
                    <p>No archived documents found.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-border bg-surface-hover text-muted">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Archived Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {archivedDocs.map((doc) => (
                                <tr key={doc.id} onClick={() => selectActiveDocument(doc.id)} className={`cursor-pointer transition-colors hover:bg-surface-hover ${activeDocument?.id === doc.id ? 'bg-accent-background' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <FileText size={20} className="text-muted" />
                                            <span className="font-medium text-main">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted">{new Date(doc.updated_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ==============================================================================
// SECTION 2: DETAIL PANEL
// ==============================================================================

const DetailPanel = ({ isOpen, onClose }) => {
    const { activeDocument } = useDocument();

    if (!isOpen) return null;

    return (
        <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-heading text-lg font-bold text-main">Details</h3>
                <button onClick={onClose} className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-main">
                    <X size={20} />
                </button>
            </div>

            {activeDocument ? (
                <div className="flex flex-col space-y-6 p-6">
                    <div className="flex flex-col items-center space-y-3 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-hover text-muted">{activeDocument.is_folder ? <Folder size={32} className="fill-accent text-accent" /> : <FileText size={32} />}</div>
                        <div>
                            <h4 className="font-medium wrap-break-word text-main">{activeDocument.name}</h4>
                            <p className="mt-1 text-xs text-muted">{activeDocument.is_folder ? 'Directory' : 'File'}</p>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-border pt-4">
                        <div>
                            <span className="block text-xs font-medium text-muted uppercase">Current Status</span>
                            <span className="mt-1 block text-sm font-medium text-main">{activeDocument.status.replace('_', ' ')}</span>
                        </div>
                        {activeDocument.summary && (
                            <div>
                                <span className="block text-xs font-medium text-muted uppercase">Summary</span>
                                <div className="mt-1 flex items-start space-x-2 rounded-lg bg-surface-hover p-3 text-sm text-main">
                                    <Info size={16} className="mt-0.5 shrink-0 text-accent" />
                                    <p className="leading-relaxed">{activeDocument.summary}</p>
                                </div>
                            </div>
                        )}
                        <div>
                            <span className="block text-xs font-medium text-muted uppercase">System Dates</span>
                            <div className="mt-1 flex flex-col space-y-1 text-sm text-main">
                                <span>
                                    <span className="text-muted">Created:</span> {new Date(activeDocument.created_at).toLocaleDateString()}
                                </span>
                                <span>
                                    <span className="text-muted">Updated:</span> {new Date(activeDocument.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-10 p-6 text-center">
                    <FileText size={48} className="mx-auto mb-4 text-border" />
                    <p className="text-sm text-muted">Select an item from the workspace or archives to view its metadata.</p>
                </div>
            )}
        </aside>
    );
};

// ==============================================================================
// SECTION 3: LAYOUT & ROUTING
// ==============================================================================

const MainLayout = () => {
    const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(true);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const location = useLocation();

    const { logout, user } = useAuthentication();
    const { unreadCount, getByRecipientId, notifications, update: updateNotification, delete: deleteNotification } = useNotification();
    const { userSetting, getByUserId, create: createUserSetting, update: updateUserSetting } = useUserSetting();

    // Fetch notifications and user settings for the logged-in user
    useEffect(() => {
        if (user?.id) {
            getByRecipientId(user.id);
            getByUserId(user.id);
        }
    }, [user?.id, getByRecipientId, getByUserId]);

    const pathName = location.pathname.split('/')[1];
    const breadcrumb = pathName ? pathName.charAt(0).toUpperCase() + pathName.slice(1) : 'Dashboard';

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-main">
            <aside className="flex w-16 flex-col items-center justify-between border-r border-border bg-surface py-6">
                <div className="flex flex-col items-center space-y-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-surface shadow-sm">
                        <ShieldCheck size={20} />
                    </div>
                    <nav className="flex flex-col space-y-4">
                        {[
                            { path: '/dashboard', icon: <LayoutDashboard size={22} /> },
                            { path: '/management', icon: <Users size={22} /> },
                            { path: '/documents', icon: <FolderOpen size={22} /> },
                            { path: '/requests', icon: <Ticket size={22} /> },
                            { path: '/archives', icon: <Archive size={22} /> },
                        ].map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-accent-background text-accent' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                            >
                                {item.icon}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-col items-center space-y-4">
                    <button onClick={() => setIsSettingsOpen((s) => !s)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-main">
                        <UserCircle size={24} />
                    </button>
                    <button onClick={logout} className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-error-background hover:text-error-text">
                        <LogOut size={22} />
                    </button>
                </div>
            </aside>

            <main className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-8">
                    <div className="flex items-center text-sm font-medium text-muted">
                        <span className="text-main">{breadcrumb}</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="relative flex items-center text-muted focus-within:text-main">
                            <Search size={16} className="absolute left-3" />
                            <input type="text" placeholder="Search..." className="h-9 w-64 rounded-full border-none bg-background pr-4 pl-10 text-sm ring-1 ring-border transition-all outline-none focus:ring-accent" />
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsNotifOpen((s) => !s)} className="relative text-muted transition-colors hover:text-main">
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent ring-2 ring-surface"></span>}
                            </button>
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-surface shadow-lg">
                                    <div className="border-b border-border p-3 text-sm font-medium">Notifications</div>
                                    <div className="max-h-64 overflow-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-sm text-muted">No notifications.</div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div key={n.id} className={`flex items-start justify-between gap-3 p-3 hover:bg-surface-hover ${!n.is_read ? 'bg-surface-hover' : ''}`}>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-main">{n.title || n.message}</div>
                                                        <div className="mt-1 text-xs text-muted">{new Date(n.created_at).toLocaleString()}</div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={async () => {
                                                                await updateNotification(n.id, { is_read: true });
                                                            }}
                                                            className="text-muted hover:text-main"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('Delete notification?')) await deleteNotification(n.id);
                                                            }}
                                                            className="text-muted hover:text-red-600"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsDetailPanelOpen(!isDetailPanelOpen)} className={`transition-colors ${isDetailPanelOpen ? 'text-accent' : 'text-muted hover:text-main'}`}>
                            {isDetailPanelOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                        </button>
                    </div>
                </header>
                {isSettingsOpen && (
                    <div className="absolute top-20 right-8 z-50 w-64 rounded-lg border border-border bg-surface shadow-lg">
                        <div className="border-b border-border p-3 text-sm font-medium">User Settings</div>
                        <div className="p-3">
                            {userSetting ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm">Compact view</div>
                                        <input type="checkbox" checked={!!userSetting.compact_view} onChange={async () => await updateUserSetting(user.id, { compact_view: !userSetting.compact_view })} />
                                    </div>
                                    <div className="text-xs text-muted">Your preferences are saved to your account.</div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-sm text-muted">No settings yet.</div>
                                    <div className="flex justify-end">
                                        <button onClick={() => createUserSetting(user.id)} className="rounded bg-main px-3 py-1 text-sm text-surface">
                                            Create
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>

            <DetailPanel isOpen={isDetailPanelOpen} onClose={() => setIsDetailPanelOpen(false)} />
        </div>
    );
};

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthentication((state) => state.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/management" element={<ManagementPage />} />
                    <Route path="/requests" element={<RequestPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/archives" element={<ArchivesPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
