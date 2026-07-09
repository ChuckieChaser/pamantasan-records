import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthentication, useDocument, useDocumentVersion } from '../stores';
import { USERS_ROLE } from '../constants';
import DocumentBrowser from '../components/documents/DocumentBrowser';

// ==============================================================================
// SECTION 1: PAGE
// ==============================================================================

export default function Archives() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const searchParams = new URLSearchParams(location.search);
    const currentFolderId = searchParams.get('folder') || null;

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
            return [];
        }
        return documents
            .filter(d => d.is_archived && d.parent_id === currentFolderId)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [documents, user, currentFolderId]);

    const currentPathSegments = useMemo(() => {
        if (!currentFolderId) return [];
        const folderChain = [];
        let current = documents.find(d => d.id === currentFolderId);
        while (current) {
            folderChain.unshift(current.name);
            current = documents.find(d => d.id === current.parent_id);
        }
        return folderChain;
    }, [documents, currentFolderId]);

    // --- Handlers ---
    const handleDocumentClick = (id) => {
        if (activeDocument?.id === id) {
            deselectActiveDocument();
        } else {
            selectActiveDocument(id);
        }
    };

    const handleDocumentDoubleClick = (id) => {
        const doc = documents.find(d => d.id === id);
        if (doc?.is_folder) {
            navigate(`/archives?folder=${doc.id}`);
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
                title={currentFolderId ? `Archived Folder: ${currentPathSegments[currentPathSegments.length - 1]}` : "Archived Documents"}
                description="Documents that have been archived and are no longer in active circulation."
                documents={archivedDocs}
                documentVersions={documentVersions}
                activeDocumentId={activeDocument?.id}
                onDocumentClick={handleDocumentClick}
                onDocumentDoubleClick={handleDocumentDoubleClick}
                isArchiveBrowser={true}
            />
        </div>
    );
}
