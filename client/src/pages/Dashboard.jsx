import { useEffect, useMemo } from 'react';
import { FileText, FileClock, XCircle, Clock, Activity } from 'lucide-react';

import { useAuthentication, useDocument, useCoordinatorRequest, useDocumentRequest, useDocumentVersion, useDocumentShare, useAttachment, useAuditLog, useUser } from '../stores';
import { USERS_ROLE, COORDINATOR_REQUESTS_STATUS, DOCUMENT_REQUESTS_STATUS, DOCUMENT_SHARE_STATUS } from '../constants';

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
    const { attachments, getAll: getAttachments } = useAttachment();
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
            getAttachments();
        }

        return () => {
            deselectActiveDocument();
            deselectActiveAuditLog();
        };
    }, [user, getDocuments, getCoordinatorRequests, getDocumentRequests, getDocumentRequestsByRequesterId, getDocumentVersions, getDocumentShares, getAttachments, getAuditLogs, deselectActiveDocument, deselectActiveAuditLog, users.length, getUsers]);

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
        documentShares.filter(s => s.status === DOCUMENT_SHARE_STATUS.PENDING_APPROVAL).length
        , [documentShares]);

    const pendingPublication = useMemo(() =>
        documentShares.filter(s => s.status === DOCUMENT_SHARE_STATUS.APPROVED).length
        , [documentShares]);

    // ==============================================================================
    // SECTION 4: DOCUMENT SETS (folders excluded, files only for now)
    // ==============================================================================

    // Prep for folder navigation: currentFolderId logic is in place for future expansion
    const pendingApprovalDocs = useMemo(() => {
        return visibleDocuments
            .filter(d => documentShares.some(s => s.document_id === d.id && s.status === DOCUMENT_SHARE_STATUS.PENDING_APPROVAL))
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [visibleDocuments, documentShares]);

    const pendingPublicationDocs = useMemo(() => {
        return visibleDocuments
            .filter(d => documentShares.some(s => s.document_id === d.id && s.status === DOCUMENT_SHARE_STATUS.APPROVED))
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [visibleDocuments, documentShares]);

    const sharedDocsList = useMemo(() => {
        const sharedDocs = documentShares
            .map(ds => visibleDocuments.find(d => d.id === ds.document_id))
            .filter(Boolean);
        return Array.from(new Set(sharedDocs.map(d => d.id))).map(id => sharedDocs.find(d => d.id === id));
    }, [documentShares, visibleDocuments]);

    const publishedDocs = useMemo(() => {
        return visibleDocuments
            .filter(d => documentShares.some(s => s.document_id === d.id && s.status === DOCUMENT_SHARE_STATUS.PUBLISHED))
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [visibleDocuments, documentShares]);

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
