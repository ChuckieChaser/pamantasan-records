// ==============================================================================
// SECTION 1: PAGE — Requests
// Available to: Director, Officer, Member (everyone except Admin and Coordinator)
// ==============================================================================

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuthentication, useDocumentRequest, useUser, useDocumentRequestMessage, useAttachment, useDocument, useDocumentVersion, useDocumentShare } from '../stores';
import { USERS_ROLE } from '../constants';
import DocumentRequestBrowser from '../components/management/DocumentRequestBrowser';
import DocumentRequestInspector from '../components/management/DocumentRequestInspector';
import DocumentRequestModal from '../components/management/DocumentRequestModal';

// ==============================================================================
// SECTION 2: EXPORTS
// ==============================================================================

export default function Requests() {
    const { user } = useAuthentication();
    const { users, getAll: getUsers } = useUser();
    const {
        documentRequests,
        getAll: getAllRequests,
        getByRequesterId,
        create: createRequest,
    } = useDocumentRequest();
    const { documentRequestMessages, getByDocumentRequestId } = useDocumentRequestMessage();

    const [activeRequestId, setActiveRequestId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const isAdminOrCoord = user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR;

    // Load requests and users
    useEffect(() => {
        if (!user) return;
        getUsers();
        if (isAdminOrCoord) {
            getAllRequests();
        } else {
            getByRequesterId(user.id);
        }
    }, [user?.id]);

    // Load messages when a request is selected
    useEffect(() => {
        if (activeRequestId) {
            getByDocumentRequestId(activeRequestId);
        }
    }, [activeRequestId]);

    const selectedRequest = myRequests.find(r => r.id === activeRequestId) || null;

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-main">Requests</h1>
                    <p className="mt-1 text-sm text-muted">Submit and track your document requests.</p>
                </div>
                {!isAdminOrCoord && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                        <Plus className="size-4" /> New Request
                    </button>
                )}
            </div>

            <div className="flex gap-4 flex-1 min-h-[500px]">
                <div className="w-96 shrink-0 h-full flex flex-col">
                    <DocumentRequestBrowser
                        title="Your Requests"
                        description="Track and manage your requests."
                        requests={myRequests}
                        users={users}
                        activeRequestId={activeRequestId}
                        onRequestClick={(id) => setActiveRequestId(id === activeRequestId ? null : id)}
                    />
                </div>
                
                <div className="flex-1 flex flex-col h-[500px]">
                    {selectedRequest ? (
                        <div className="h-full border border-border rounded-xl bg-surface flex flex-col overflow-hidden shadow-sm">
                            <DocumentRequestInspector 
                                request={selectedRequest}
                                onClose={() => setActiveRequestId(null)}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8 border border-border rounded-xl bg-surface/50 border-dashed">
                            <div className="size-16 rounded-full bg-surface-hover flex items-center justify-center mb-2">
                                <MessageSquare className="size-8 text-muted" />
                            </div>
                            <h3 className="text-lg font-bold text-main">No Request Selected</h3>
                            <p className="text-sm text-muted max-w-sm">Select a request from the sidebar to view its details, or create a new request.</p>
                        </div>
                    )}
                </div>
            </div>

            <DocumentRequestModal 
                isOpen={isCreating} 
                onClose={() => setIsCreating(false)} 
                onCreated={(id) => setActiveRequestId(id)}
            />
        </div>
    );
}
