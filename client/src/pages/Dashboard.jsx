import { useEffect, useMemo } from 'react';
import { FileText, FileClock, XCircle, Clock, Activity } from 'lucide-react';

import { useAuthentication, useDocument, useCoordinatorRequest, useDocumentRequest, useDocumentVersion, useDocumentShare, useAuditLog, useUser } from '../stores';
import { USERS_ROLE, COORDINATOR_REQUESTS_STATUS, DOCUMENT_REQUESTS_STATUS, DOCUMENTS_STATUS } from '../constants';

import MetricCard from '../components/dashboard/MetricCard';
import AuditBrowser from '../components/dashboard/AuditBrowser';
import DocumentBrowser from '../components/documents/DocumentBrowser';

// ==============================================================================
// SECTION 1: PAGE
// ==============================================================================

export default function Dashboard() {
    const { user } = useAuthentication();
    const { documents, activeDocument, getAll: getDocuments, selectActiveDocument, deselectActiveDocument } = useDocument();
    const { coordinatorRequests, getAll: getCoordinatorRequests } = useCoordinatorRequest();
    const { documentRequests, getAll: getDocumentRequests, getByRequesterId: getDocumentRequestsByRequesterId } = useDocumentRequest();
    const { documentVersions, getAll: getDocumentVersions } = useDocumentVersion();
    const { documentShares, getAll: getDocumentShares } = useDocumentShare();
    const { auditLogs, activeAuditLog, getAll: getAuditLogs, selectActiveAuditLog, deselectActiveAuditLog } = useAuditLog();
    const { users, getAll: getUsers } = useUser();

    // --- Load data on mount ---
    useEffect(() => {
        if (users.length === 0) getUsers();
        getDocuments();
        getDocumentVersions();

        if (user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) {
            getCoordinatorRequests();
            getDocumentRequests();
            getAuditLogs();
        } else if (user?.id) {
            getDocumentRequestsByRequesterId(user.id);
        }

        if (user?.id) {
            getDocumentShares();
        }

        return () => {
            deselectActiveDocument();
            deselectActiveAuditLog();
        };
    }, [user, getDocuments, getCoordinatorRequests, getDocumentRequests, getDocumentRequestsByRequesterId, getDocumentVersions, getDocumentShares, getAuditLogs, deselectActiveDocument, deselectActiveAuditLog, users.length, getUsers]);

    // ==============================================================================
    // SECTION 2: ACCESS CONTROL
    // The server enforces Row Level Security on every query, so the documents
    // array already contains only what this user is allowed to see.
    // No client-side RLS mirror needed.
    // ==============================================================================

    const visibleDocuments = documents;

    // ==============================================================================
    // SECTION 3: METRICS
    // ==============================================================================

    const totalDocuments = useMemo(() => visibleDocuments.filter(d => !d.is_folder).length, [visibleDocuments]);

    const pendingCoordinator = useMemo(() =>
        coordinatorRequests.filter(r => r.status === COORDINATOR_REQUESTS_STATUS.PENDING).length
        , [coordinatorRequests]);

    const pendingDocumentReq = useMemo(() =>
        documentRequests.filter(r => r.status === DOCUMENT_REQUESTS_STATUS.OPEN).length
        , [documentRequests]);

    const rejectedDocuments = useMemo(() =>
        documentVersions.filter(v => v.rejecter_id != null).length
        , [documentVersions]);

    const pendingApproval = useMemo(() =>
        visibleDocuments.filter(d => d.status === DOCUMENTS_STATUS.PENDING_OFFICER).length
        , [visibleDocuments]);

    const pendingPublication = useMemo(() =>
        visibleDocuments.filter(d => d.status === DOCUMENTS_STATUS.PENDING_DIRECTOR).length
        , [visibleDocuments]);

    // ==============================================================================
    // SECTION 4: DOCUMENT SETS (folders excluded, files only for now)
    // ==============================================================================

    // Prep for folder navigation: currentFolderId logic is in place for future expansion
    const pendingApprovalDocs = useMemo(() => {
        return visibleDocuments
            .filter(d => d.status === DOCUMENTS_STATUS.PENDING_OFFICER)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [visibleDocuments]);

    const pendingPublicationDocs = useMemo(() => {
        return visibleDocuments
            .filter(d => d.status === DOCUMENTS_STATUS.PENDING_DIRECTOR)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [visibleDocuments]);

    const sharedDocsList = useMemo(() => {
        const sharedDocs = documentShares
            .filter(ds => !ds.document_request_id)
            .map(ds => visibleDocuments.find(d => d.id === ds.document_id))
            .filter(Boolean);
        return Array.from(new Set(sharedDocs.map(d => d.id))).map(id => sharedDocs.find(d => d.id === id));
    }, [documentShares, visibleDocuments]);

    const publishedDocs = useMemo(() => {
        return visibleDocuments
            .filter(d => d.status === DOCUMENTS_STATUS.PUBLISHED)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [visibleDocuments]);

    const requestedDocs = useMemo(() => {
        const reqDocs = documentShares
            .filter(ds => ds.document_request_id)
            .map(ds => visibleDocuments.find(d => d.id === ds.document_id))
            .filter(Boolean);
        return Array.from(new Set(reqDocs.map(d => d.id))).map(id => reqDocs.find(d => d.id === id));
    }, [documentShares, visibleDocuments]);

    // --- Handlers ---
    const handleDocumentClick = (id) => {
        if (activeDocument?.id === id) {
            deselectActiveDocument();
        } else {
            if (activeAuditLog) deselectActiveAuditLog();
            selectActiveDocument(id);
        }
    };

    const handleAuditClick = (id) => {
        if (activeAuditLog?.id === id) {
            deselectActiveAuditLog();
        } else {
            if (activeDocument) deselectActiveDocument();
            selectActiveAuditLog(id);
        }
    };

    const requestedDocsStatus = {
        header: 'Provider',
        render: (doc) => {
            const share = documentShares.find(ds => ds.document_id === doc.id && ds.document_request_id);
            if (!share) return <span className="font-medium text-muted">Unknown</span>;
            const provider = users.find(u => u.id === share.sharer_id);
            if (!provider) return <span className="font-medium text-main">Unknown</span>;
            return (
                <div className="flex items-center gap-2">
                    <img src={provider.avatar_path || '/assets/default_avatar.jpg'} alt="Avatar" className="h-5 w-5 rounded-full object-cover shrink-0" />
                    <span className="font-medium text-main">{provider.first_name} {provider.last_name}</span>
                </div>
            );
        }
    };

    const dispatchedDocsStatus = {
        header: 'Recipient',
        render: (doc) => {
            const share = documentShares.find(ds => ds.document_id === doc.id && ds.document_request_id);
            if (!share) return <span className="font-medium text-muted">Unknown</span>;
            const recipient = users.find(u => u.id === share.recipient_id);
            if (!recipient) return <span className="font-medium text-main">Unknown</span>;
            return (
                <div className="flex items-center gap-2">
                    <img src={recipient.avatar_path || '/assets/default_avatar.jpg'} alt="Avatar" className="h-5 w-5 rounded-full object-cover shrink-0" />
                    <span className="font-medium text-main">{recipient.first_name} {recipient.last_name}</span>
                </div>
            );
        }
    };

    // ==============================================================================
    // SECTION 5: RENDER
    // ==============================================================================

    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold text-main">Dashboard</h1>
                <p className="mt-1 text-sm text-muted">Overview of the system activities and documents.</p>
            </div>

            {/* --- Overview Metrics --- */}
            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-main">Overview Metrics</h2>
                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                    <MetricCard title="Total Documents" value={totalDocuments} icon={FileText} colorTheme="accent" to="/documents" />

                    {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                        <MetricCard title="Pending Coordinator Requests" value={pendingCoordinator} icon={FileClock} colorTheme="warning" to="/management" />
                    )}

                    {user?.role === USERS_ROLE.OFFICER && (
                        <MetricCard title="Pending Approval" value={pendingApproval} icon={FileClock} colorTheme="warning" to="/documents" />
                    )}

                    {user?.role === USERS_ROLE.DIRECTOR && (
                        <MetricCard title="Pending Publication" value={pendingPublication} icon={FileClock} colorTheme="warning" to="/documents" />
                    )}

                    <MetricCard title="Pending Document Requests" value={pendingDocumentReq} icon={Clock} colorTheme="warning" to="/requests" />

                    {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                        <MetricCard title="Rejected Documents" value={rejectedDocuments} icon={XCircle} colorTheme="error" to="/archives" />
                    )}
                </div>
            </section>

            {/* --- Pending Documents (Officers) --- */}
            {user?.role === USERS_ROLE.OFFICER && (
                <DocumentBrowser
                    title="Pending Approval"
                    description="Documents awaiting your review and approval."
                    documents={pendingApprovalDocs}
                    documentVersions={documentVersions}
                    activeDocumentId={activeDocument?.id}
                    onDocumentClick={handleDocumentClick}
                />
            )}

            {/* --- Pending Documents (Directors) --- */}
            {user?.role === USERS_ROLE.DIRECTOR && (
                <DocumentBrowser
                    title="Pending Publication"
                    description="Documents awaiting your final review and publication."
                    documents={pendingPublicationDocs}
                    documentVersions={documentVersions}
                    activeDocumentId={activeDocument?.id}
                    onDocumentClick={handleDocumentClick}
                />
            )}

            {/* --- Published Documents (Members) --- */}
            {user?.role === USERS_ROLE.MEMBER && (
                <DocumentBrowser
                    title="Published Documents"
                    description="Official documents published and available for your reference."
                    documents={publishedDocs}
                    documentVersions={documentVersions}
                    activeDocumentId={activeDocument?.id}
                    onDocumentClick={handleDocumentClick}
                />
            )}

            {/* --- Requested Documents (Member, Officer, Director) --- */}
            {(user?.role === USERS_ROLE.MEMBER || user?.role === USERS_ROLE.OFFICER || user?.role === USERS_ROLE.DIRECTOR) && (
                <DocumentBrowser
                    title="Requested Documents"
                    description="Documents that have been shared with you via document requests."
                    documents={requestedDocs}
                    documentVersions={documentVersions}
                    activeDocumentId={activeDocument?.id}
                    onDocumentClick={handleDocumentClick}
                    customStatus={requestedDocsStatus}
                />
            )}

            {/* --- Shared Documents (Admin/Coordinator) --- */}
            {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                <DocumentBrowser
                    title="Shared Documents"
                    description="Documents manually shared with departments or specific users."
                    documents={sharedDocsList}
                    documentVersions={documentVersions}
                    activeDocumentId={activeDocument?.id}
                    onDocumentClick={handleDocumentClick}
                />
            )}

            {/* --- Dispatched Documents (Admin/Coordinator) --- */}
            {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                <DocumentBrowser
                    title="Dispatched Documents"
                    description="Documents that were securely sent out to fulfill document requests."
                    documents={requestedDocs}
                    documentVersions={documentVersions}
                    activeDocumentId={activeDocument?.id}
                    onDocumentClick={handleDocumentClick}
                    customStatus={dispatchedDocsStatus}
                />
            )}

            {/* --- Audit Logs (Admin/Coordinator) --- */}
            {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                <AuditBrowser
                    title="System Audit Logs"
                    description="Recent system activities and security events."
                    audits={auditLogs}
                    activeAuditLogId={activeAuditLog?.id}
                    onAuditClick={handleAuditClick}
                />
            )}
        </div>
    );
}
