import { useEffect, useMemo } from 'react';
import { useAuthentication, useDocument, useDocumentVersion } from '../stores';
import { DOCUMENTS_STATUS, USERS_ROLE } from '../constants';
import DocumentBrowser from '../components/documents/DocumentBrowser';

// ==============================================================================
// SECTION 1: PAGE
// ==============================================================================

export default function Archives() {
    const { user } = useAuthentication();
    const { documents, activeDocument, getAll: getDocuments, selectActiveDocument, deselectActiveDocument } = useDocument();
    const { documentVersions, getAll: getDocumentVersions } = useDocumentVersion();

    // --- Load data on mount ---
    useEffect(() => {
        getDocuments();
        getDocumentVersions();
        return () => {
            deselectActiveDocument();
        };
    }, [getDocuments, getDocumentVersions, deselectActiveDocument]);

    // --- Derived Data ---
    const archivedDocs = useMemo(() => {
        if (!user || (user.role !== USERS_ROLE.ADMINISTRATOR && user.role !== USERS_ROLE.COORDINATOR)) {
            return []; // Only Admin/Coordinator should see the Archives page typically, based on routes.
        }
        return documents
            .filter(d => d.status === DOCUMENTS_STATUS.ARCHIVED)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [documents, user]);

    // --- Handlers ---
    const handleDocumentClick = (id) => {
        if (activeDocument?.id === id) {
            deselectActiveDocument();
        } else {
            selectActiveDocument(id);
        }
    };

    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold text-main">Archives</h1>
                <p className="mt-1 text-sm text-muted">View and manage archived documents.</p>
            </div>

            {/* --- Archived Documents --- */}
            <DocumentBrowser
                title="Archived Documents"
                description="Documents that have been archived and are no longer in active circulation."
                documents={archivedDocs}
                documentVersions={documentVersions}
                activeDocumentId={activeDocument?.id}
                onDocumentClick={handleDocumentClick}
            />
        </div>
    );
}
