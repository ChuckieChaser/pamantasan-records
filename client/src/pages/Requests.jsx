// ==============================================================================
// SECTION 1: PAGE — Requests
// Available to: Director, Officer, Member (everyone except Admin and Coordinator)
// ==============================================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageSquare, Plus, Send, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthentication, useDocumentRequest, useDocumentRequestMessage, useUser } from '../stores';
import { DOCUMENT_REQUESTS_STATUS, USERS_ROLE } from '../constants';

// --- Status badge helper ---
function StatusBadge({ status }) {
    const map = {
        [DOCUMENT_REQUESTS_STATUS.OPEN]: { label: 'Open', color: 'text-blue-500 bg-blue-500/10' },
        [DOCUMENT_REQUESTS_STATUS.RESOLVED]: { label: 'Resolved', color: 'text-green-500 bg-green-500/10' },
        [DOCUMENT_REQUESTS_STATUS.REJECTED]: { label: 'Rejected', color: 'text-red-500 bg-red-500/10' },
    };
    const { label, color } = map[status] || { label: status, color: 'text-muted bg-surface-hover' };
    return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${color}`}>{label}</span>;
}

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
    const {
        documentRequestMessages,
        getByDocumentRequestId,
        create: sendMessage,
    } = useDocumentRequestMessage();

    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);

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
        if (selectedRequestId) {
            getByDocumentRequestId(selectedRequestId);
        }
    }, [selectedRequestId]);

    // Auto-scroll messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [documentRequestMessages, selectedRequestId]);

    const myRequests = useMemo(() => {
        return documentRequests
            .filter(r => isAdminOrCoord || r.requester_id === user?.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [documentRequests, user?.id, isAdminOrCoord]);

    const selectedRequest = myRequests.find(r => r.id === selectedRequestId) || null;

    const messages = useMemo(() => {
        return documentRequestMessages
            .filter(m => m.document_request_id === selectedRequestId)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }, [documentRequestMessages, selectedRequestId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !user) return;
        setIsSubmitting(true);
        try {
            const req = await createRequest({
                requester_id: user.id,
                subject: newTitle.trim() + (newBody.trim() ? `\n\n${newBody.trim()}` : ''),
            });
            setIsCreating(false);
            setNewTitle('');
            setNewBody('');
            setSelectedRequestId(req.id);
        } catch (err) {
            console.error('Failed to create request', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !user || !selectedRequestId) return;
        setIsSending(true);
        try {
            await sendMessage({
                document_request_id: selectedRequestId,
                user_id: user.id,
                message: chatInput.trim(),
            });
            setChatInput('');
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setIsSending(false);
        }
    };

    const getSenderName = (userId) => {
        const u = users.find(u => u.id === userId);
        if (!u) return 'Unknown';
        return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;
    };

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

            {/* New Request Form */}
            {isCreating && (
                <div className="rounded-xl border border-border bg-surface p-5">
                    <h2 className="text-sm font-bold text-main mb-4">New Document Request</h2>
                    <form onSubmit={handleCreate} className="flex flex-col gap-3">
                        <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1">Title *</label>
                            <input
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Briefly describe what you need…"
                                className="w-full rounded-md border border-border bg-surface-hover px-3 py-2 text-sm text-main placeholder-muted outline-none focus:border-accent transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1">Description</label>
                            <textarea
                                value={newBody}
                                onChange={e => setNewBody(e.target.value)}
                                placeholder="Provide more context (optional)…"
                                rows={3}
                                className="w-full rounded-md border border-border bg-surface-hover px-3 py-2 text-sm text-main placeholder-muted outline-none focus:border-accent transition-colors resize-none"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 rounded-md text-sm text-muted hover:text-main transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !newTitle.trim()}
                                className="px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {isSubmitting ? 'Submitting…' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Main layout: list + chat */}
            <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '500px' }}>
                {/* Request List */}
                <div className="w-80 shrink-0 flex flex-col gap-2 overflow-y-auto">
                    {myRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageSquare className="size-10 text-muted opacity-30 mb-3" />
                            <p className="text-sm text-muted">No requests yet.</p>
                            {!isAdminOrCoord && (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="mt-3 text-xs text-accent hover:underline"
                                >
                                    Create your first request
                                </button>
                            )}
                        </div>
                    ) : (
                        myRequests.map(req => {
                            const isSelected = req.id === selectedRequestId;
                            return (
                                <button
                                    key={req.id}
                                    onClick={() => setSelectedRequestId(req.id)}
                                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                                        isSelected
                                            ? 'border-accent bg-accent/5'
                                            : 'border-border bg-surface hover:bg-surface-hover'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-main line-clamp-1">{req.subject || 'Untitled Request'}</p>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <p className="text-xs text-muted mt-1">{new Date(req.created_at).toLocaleString()}</p>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col rounded-xl border border-border bg-surface overflow-hidden">
                    {selectedRequest ? (
                        <>
                            {/* Chat header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                                <div>
                                    <p className="text-sm font-bold text-main">{selectedRequest.subject || 'Request Thread'}</p>
                                    <p className="text-xs text-muted">
                                        Opened {new Date(selectedRequest.created_at).toLocaleString()} · <StatusBadge status={selectedRequest.status} />
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                                {selectedRequest.subject?.includes('\n\n') && (
                                    <div className="rounded-lg bg-surface-hover border border-border p-3 text-sm text-muted italic">
                                        {selectedRequest.subject.split('\n\n').slice(1).join('\n\n')}
                                    </div>
                                )}
                                {messages.length === 0 && (
                                    <p className="text-xs text-muted text-center mt-4">No messages yet. Start the conversation.</p>
                                )}
                                {messages.map(msg => {
                                    const isMe = msg.user_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-xs text-muted mb-0.5">{getSenderName(msg.user_id)}</span>
                                            <div className={`max-w-xs rounded-xl px-3.5 py-2.5 text-sm ${
                                                isMe
                                                    ? 'bg-accent text-white rounded-br-sm'
                                                    : 'bg-surface-hover text-main rounded-bl-sm'
                                            }`}>
                                                {msg.message}
                                            </div>
                                            <span className="text-xs text-muted mt-0.5">{new Date(msg.created_at).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Message input */}
                            {selectedRequest.status === DOCUMENT_REQUESTS_STATUS.OPEN && (
                                <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Type a message…"
                                        className="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-main placeholder-muted outline-none focus:border-accent transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSending || !chatInput.trim()}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                                    >
                                        <Send className="size-3.5" /> Send
                                    </button>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8">
                            <MessageSquare className="size-10 text-muted opacity-30" />
                            <p className="text-sm text-muted">Select a request to view the conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
