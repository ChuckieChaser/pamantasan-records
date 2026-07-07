import { useEffect, useMemo } from 'react';
import { FileText, FileClock, XCircle, Clock, Activity } from 'lucide-react';

import { useAuthentication, useDocument, useCoordinatorRequest, useDocumentRequest, useDocumentVersion, useDocumentShare, useAuditLog } from '../stores';
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

    // --- Load data on mount ---
    useEffect(() => {
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
    }, [user, getDocuments, getCoordinatorRequests, getDocumentRequests, getDocumentRequestsByRequesterId, getDocumentVersions, getDocumentShares, getAuditLogs, deselectActiveDocument, deselectActiveAuditLog]);

    // ==============================================================================
    // SECTION 2: ACCESS CONTROL FILTER (mirrors server RLS)
    // ==============================================================================

    const visibleDocuments = useMemo(() => {
        if (!user) return [];
        if (user.role === USERS_ROLE.ADMINISTRATOR || user.role === USERS_ROLE.COORDINATOR) return documents;

        return documents.filter(doc => {
            if (doc.status === DOCUMENTS_STATUS.ARCHIVED) return false;
            if (doc.uploader_id === user.id) return true;

            const isRejecter = documentVersions.some(dv => dv.document_id === doc.id && dv.rejecter_id === user.id);
            if (isRejecter) return true;

            const hasAccess = documentShares.some(ds => {
                if (ds.document_id === doc.id) {
                    if (ds.department_id === user.department_id) {
                        if ((doc.status === DOCUMENTS_STATUS.PENDING_OFFICER || doc.status === DOCUMENTS_STATUS.PENDING_DIRECTOR || doc.status === DOCUMENTS_STATUS.PUBLISHED) && user.role === USERS_ROLE.OFFICER) return true;
                        if ((doc.status === DOCUMENTS_STATUS.PENDING_DIRECTOR || doc.status === DOCUMENTS_STATUS.PUBLISHED) && user.role === USERS_ROLE.DIRECTOR) return true;
                        if (doc.status === DOCUMENTS_STATUS.PUBLISHED && user.role === USERS_ROLE.MEMBER && (!ds.recipient_id || ds.recipient_id === user.id)) return true;
                    }
                    if (doc.status === DOCUMENTS_STATUS.ATTACHMENT && ds.document_request_id) {
                        const req = documentRequests.find(dr => dr.id === ds.document_request_id);
                        if (req && req.requester_id === user.id) return true;
                    }
                }
                return false;
            });

            return hasAccess;
        });
    }, [documents, user, documentVersions, documentShares, documentRequests]);

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
        documentVersions.filter(v => v.rejected_at !== null).length
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
            .map(ds => visibleDocuments.find(d => d.id === ds.document_id))
            .filter(Boolean);
        return Array.from(new Set(sharedDocs.map(d => d.id))).map(id => sharedDocs.find(d => d.id === id));
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
            {user?.role !== USERS_ROLE.MEMBER && (
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

                        {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                            <MetricCard title="Pending Document Requests" value={pendingDocumentReq} icon={Clock} colorTheme="warning" to="/requests" />
                        )}

                        {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                            <MetricCard title="Rejected Documents" value={rejectedDocuments} icon={XCircle} colorTheme="error" to="/archives" />
                        )}
                    </div>
                </section>
            )}

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

            {/* --- Shared Documents (Admin/Coordinator) --- */}
            {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                <DocumentBrowser
                    title="Shared Documents"
                    description="Documents shared with your department or via requests."
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
