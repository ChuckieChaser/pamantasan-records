// ==============================================================================
// SECTION 1: PAGE
// ==============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuthentication, useDocument, useDocumentVersion, useDocumentViewer } from '../stores';
import DocumentBrowser from '../components/documents/DocumentBrowser';
import AddDocumentsModal from '../components/documents/AddDocumentsModal';
import NewFolderModal from '../components/documents/NewFolderModal';
import UploadDocumentsModal from '../components/documents/UploadDocumentsModal';
import { USERS_ROLE } from '../constants';

// ==============================================================================
// SECTION 1: PAGE
// ==============================================================================

export default function Documents() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const searchParams = new URLSearchParams(location.search);
    const currentFolderId = searchParams.get('folder') || null;

    const { user } = useAuthentication();
    const { documents, getAll: getDocuments, selectActiveDocument } = useDocument();
    const { documentVersions, getAll: getDocumentVersions } = useDocumentVersion();
    const { openViewer } = useDocumentViewer();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        getDocuments();
        getDocumentVersions();
    }, [getDocuments, getDocumentVersions]);

    // --- Derived Data ---

    const currentDocuments = useMemo(() => {
        return documents.filter(d => d.parent_id === currentFolderId);
    }, [documents, currentFolderId]);

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
        selectActiveDocument(id);
    };

    const handleDocumentDoubleClick = (id) => {
        const doc = documents.find(d => d.id === id);
        if (doc?.is_folder) {
            navigate(`/documents?folder=${doc.id}`);
        } else {
            openViewer(doc);
        }
    };

    const handleSelectNewFolder = () => {
        setIsAddModalOpen(false);
        setIsNewFolderOpen(true);
    };

    const handleSelectUploadFile = () => {
        setIsAddModalOpen(false);
        setIsUploadOpen(true);
    };

    // Allow upload if Admin, Coordinator, or Officer (depending on requirements, usually these roles can upload)
    const canAddDocuments = [USERS_ROLE.ADMINISTRATOR, USERS_ROLE.COORDINATOR, USERS_ROLE.OFFICER].includes(user?.role);

    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold text-main">Documents</h1>
                <p className="mt-1 text-sm text-muted">Browse and manage all documents in the system.</p>
            </div>


            <DocumentBrowser
                title={currentFolderId ? `Folder: ${currentPathSegments[currentPathSegments.length - 1]}` : "All Documents"}
                documents={currentDocuments}
                documentVersions={documentVersions}
                onDocumentClick={handleDocumentClick}
                onDocumentDoubleClick={handleDocumentDoubleClick}
                canAddDocuments={canAddDocuments}
                onAddDocuments={() => setIsAddModalOpen(true)}
            />

            {/* Modals */}
            <AddDocumentsModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSelectNewFolder={handleSelectNewFolder}
                onSelectUploadFile={handleSelectUploadFile}
            />

            {isNewFolderOpen && (
                <NewFolderModal
                    isOpen={isNewFolderOpen}
                    onClose={() => setIsNewFolderOpen(false)}
                    currentFolderId={currentFolderId}
                    currentPathSegments={currentPathSegments}
                />
            )}

            {isUploadOpen && (
                <UploadDocumentsModal
                    isOpen={isUploadOpen}
                    onClose={() => {
                        setIsUploadOpen(false);
                        getDocuments(); // refresh after upload
                    }}
                    currentFolderId={currentFolderId}
                />
            )}
        </div>
    );
}
