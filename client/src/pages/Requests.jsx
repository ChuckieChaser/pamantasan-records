// ==============================================================================
// SECTION 1: PAGE — Requests
// Available to: Director, Officer, Member (everyone except Admin and Coordinator)
// ==============================================================================

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuthentication, useDocumentRequest, useUser, useDocumentRequestMessage } from '../stores';
import { USERS_ROLE } from '../constants';
import DocumentRequestBrowser from '../components/management/DocumentRequestBrowser';
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
        activeDocumentRequest,
        selectActiveDocumentRequest,
        deselectActiveDocumentRequest
    } = useDocumentRequest();
    const { documentRequestMessages, getByDocumentRequestId } = useDocumentRequestMessage();

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
        if (activeDocumentRequest) {
            getByDocumentRequestId(activeDocumentRequest.id);
        }
    }, [activeDocumentRequest]);

    useEffect(() => {
        return () => deselectActiveDocumentRequest();
    }, []);

    const myRequests = useMemo(() => {
        return documentRequests
            .filter(r => isAdminOrCoord || r.requester_id === user?.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [documentRequests, user?.id, isAdminOrCoord]);

    const handleDocumentRequestClick = (id) => {
        if (activeDocumentRequest?.id === id) {
            deselectActiveDocumentRequest();
        } else {
            selectActiveDocumentRequest(id);
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-main">Requests</h1>
                    <p className="mt-1 text-sm text-muted">Submit and track your document requests.</p>
                </div>
            </div>

            {/* Main layout: Just the Browser */}
            <DocumentRequestBrowser
                title="Your Requests"
                description="Track and manage your requests."
                requests={myRequests}
                users={users}
                activeRequestId={activeDocumentRequest?.id}
                onRequestClick={handleDocumentRequestClick}
                onCreateRequest={!isAdminOrCoord ? () => setIsCreating(true) : undefined}
            />

            <DocumentRequestModal 
                isOpen={isCreating} 
                onClose={() => setIsCreating(false)} 
                onCreated={(id) => selectActiveDocumentRequest(id)}
            />
        </div>
    );
}
