import { useEffect, useState, useRef } from 'react';
import { X, FileText, Send, CheckCircle, XCircle, Paperclip, Monitor, HardDrive, Tag, User as UserIcon, Calendar } from 'lucide-react';
import { IconButton, PrimaryButton, SecondaryButton, DestructiveButton, InputField, Badge } from '../ui';
import { TransparentBackdrop, MenuContainer, MenuBody, MenuButton, Modal } from '../ui';
import { useAuthentication, useDocumentRequestMessage, useUser, useDocumentShare, useDocumentRequest, useDocument } from '../../stores';
import { DOCUMENT_REQUESTS_STATUS } from '../../constants';
import DocumentPickerModal from './DocumentPickerModal';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

export default function DocumentRequestInspector({ request, onClose }) {
    const { user } = useAuthentication();
    const { users } = useUser();
    const { documents, create: createDocument } = useDocument();
    const { documentRequestMessages, getByDocumentRequestId, create } = useDocumentRequestMessage();
    const { update } = useDocumentRequest();

    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState('CHAT');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
    const [stagedAttachments, setStagedAttachments] = useState([]);

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const { create: createShare } = useDocumentShare();

    // --- Load Messages ---
    useEffect(() => {
        if (request) {
            getByDocumentRequestId(request.id);
        }
    }, [request?.id, getByDocumentRequestId]);

    // --- Auto Scroll ---
    useEffect(() => {
        if (activeTab === 'CHAT' && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [documentRequestMessages, activeTab]);

    // --- Derived Data ---
    const messages = (documentRequestMessages || [])
        .filter(m => m.document_request_id === request?.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // --- Handlers ---
    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !user || !request) return;

        try {
            setIsSending(true);
            const attachmentIds = [];

            for (const att of stagedAttachments) {
                if (att.type === 'local') {
                    const doc = await createDocument({
                        uploader_id: user.id,
                        name: att.file.name,
                        is_folder: false,
                    });
                    attachmentIds.push(doc.id);
                    await createShare({
                        document_id: doc.id,
                        sharer_id: user.id,
                        recipient_id: request.requester_id,
                        document_request_id: request.id,
                    });
                } else if (att.type === 'system') {
                    attachmentIds.push(att.documentId);
                    await createShare({
                        document_id: att.documentId,
                        sharer_id: user.id,
                        recipient_id: request.requester_id,
                        document_request_id: request.id,
                    });
                }
            }

            await create({
                document_request_id: request.id,
                user_id: user.id,
                message: inputValue.trim(),
                attachment_ids: attachmentIds,
            });
            
            setInputValue('');
            setStagedAttachments([]);
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleResolveSubmit = async () => {
        try {
            await update(request.id, { status: DOCUMENT_REQUESTS_STATUS.RESOLVED });
            setIsResolveModalOpen(false);
        } catch (error) {
            console.error('Failed to resolve request', error);
        }
    };

    const handleRejectSubmit = async () => {
        try {
            await update(request.id, { status: DOCUMENT_REQUESTS_STATUS.REJECTED });
            setIsRejectModalOpen(false);
        } catch (error) {
            console.error('Failed to reject request', error);
        }
    };

    const handleLocalUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setStagedAttachments(prev => [...prev, ...files.map(file => ({ type: 'local', file }))]);
        }
    };

    const handleSystemUploadSubmit = async (documentId) => {
        setStagedAttachments(prev => [...prev, { type: 'system', documentId }]);
        setIsPickerModalOpen(false);
    };

    if (!request) return null;

    const requester = users.find(u => u.id === request.requester_id);

    return (
        <aside className="flex w-100 shrink-0 flex-col border-l border-border bg-surface">
            {/* --- Header --- */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
                <h2 className="text-sm font-bold text-main">Inspector</h2>
                <IconButton icon={X} onClick={onClose} />
            </div>

            {/* --- Body --- */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* --- Identity --- */}
                <div className="flex flex-col items-center gap-3 border-b border-border p-6 text-center shrink-0">
                    <img 
                        src={requester?.avatar_path || '/assets/default_avatar.jpg'} 
                        alt="Avatar" 
                        className="h-16 w-16 rounded-full object-cover shadow-sm"
                    />
                    <div>
                        <p className="break-all text-sm font-bold text-main">{requester ? `${requester.first_name} ${requester.last_name}` : 'Unknown User'}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{request.status.replace(/_/g, ' ')}</p>
                    </div>
                </div>

                {/* --- Tabs --- */}
                <div className="flex border-b border-border shrink-0">
                    <button
                        className={`flex-1 border-b-2 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'METADATA' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-main'}`}
                        onClick={() => setActiveTab('METADATA')}
                    >
                        Metadata
                    </button>
                    <button
                        className={`flex-1 border-b-2 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'CHAT' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-main'}`}
                        onClick={() => setActiveTab('CHAT')}
                    >
                        Chat
                    </button>
                </div>

                {/* --- Details --- */}
                {activeTab === 'METADATA' && (
                    <div className="flex flex-1 flex-col overflow-y-auto p-4">
                        <div className="flex flex-col gap-6">
                            {/* Status */}
                            <div>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <Tag className="size-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Status</span>
                                </div>
                                <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                    {request.status.replace(/_/g, ' ')}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <FileText className="size-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Subject</span>
                                </div>
                                <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                    {request.subject}
                                </div>
                            </div>

                            {/* Requester */}
                            <div>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <UserIcon className="size-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Requester</span>
                                </div>
                                <div className="mt-2 break-words rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                    {requester ? `${requester.first_name} ${requester.last_name}` : 'Unknown User'}
                                </div>
                            </div>

                            {/* Dates */}
                            <div>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <Calendar className="size-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Dates</span>
                                </div>
                                <div className="mt-2 flex flex-col gap-2 rounded bg-surface-hover p-2 text-sm text-main">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Created</span>
                                        <span className="font-medium">{new Date(request.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted">Last Updated</span>
                                        <span className="font-medium">{new Date(request.updated_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'CHAT' && (
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {/* --- Chat Body --- */}
                        <div
                            ref={scrollRef}
                            className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 bg-background"
                        >
                            {messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <span className="text-sm text-muted">No messages yet. Start the conversation.</span>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.user_id === user?.id;
                                    const sender = users.find(u => u.id === msg.user_id);
                                    return (
                                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex max-w-[85%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 px-1">
                                                    {!isMe && sender && (
                                                        <img src={sender.avatar_path || '/assets/default_avatar.jpg'} alt="Avatar" className="h-4 w-4 rounded-full object-cover" />
                                                    )}
                                                    <span className="text-xs font-medium text-muted">
                                                        {isMe ? 'Me' : sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={`rounded-xl px-4 py-2 text-sm ${isMe ? 'rounded-tr-sm bg-accent text-surface' : 'rounded-tl-sm bg-surface-hover border border-border text-main'}`}>
                                                    {msg.attachment_ids && msg.attachment_ids.map(attId => {
                                                        const doc = documents.find(d => d.id === attId);
                                                        return (
                                                            <button 
                                                                key={attId} 
                                                                onClick={() => {
                                                                    // Open document in a new tab or trigger a view modal.
                                                                    // For now, logging to console as requested placeholder.
                                                                    console.log('View document:', attId);
                                                                }}
                                                                className={`flex w-full items-center gap-2 mb-2 p-2 rounded-md border hover:opacity-80 transition-opacity cursor-pointer ${isMe ? 'bg-black/10 border-black/10 text-surface' : 'bg-surface border-border text-main'}`}
                                                            >
                                                                <FileText className="size-4 shrink-0" />
                                                                <span className="truncate font-medium text-xs">
                                                                    {doc?.name || 'Attached File'}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                    {msg.message}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* --- Chat Input --- */}
                        {request.status === DOCUMENT_REQUESTS_STATUS.OPEN ? (
                            <div className="mt-auto border-t border-border bg-surface p-4">
                                {stagedAttachments.length > 0 && (
                                    <div className="flex flex-col gap-2 mb-3">
                                        {stagedAttachments.map((att, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-surface-hover border border-border p-2 rounded-md">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText className="size-4 text-accent shrink-0" />
                                                    <span className="text-sm text-main truncate font-medium">
                                                        {att.type === 'local' 
                                                            ? att.file.name 
                                                            : documents.find(d => d.id === att.documentId)?.name || 'System Document'}
                                                    </span>
                                                </div>
                                                <IconButton icon={X} size="small" onClick={() => {
                                                    setStagedAttachments(prev => prev.filter((_, i) => i !== idx));
                                                }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <form onSubmit={handleSend} className="flex items-center gap-2">
                                    <div className="relative">
                                        <IconButton
                                            icon={Paperclip}
                                            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                                            active={isAttachmentMenuOpen}
                                        />
                                        {isAttachmentMenuOpen && (
                                            <>
                                                <TransparentBackdrop onClick={() => setIsAttachmentMenuOpen(false)} />
                                                <MenuContainer className="bottom-full left-0 mb-2 w-56">
                                                    <MenuBody>
                                                        <MenuButton
                                                            icon={Monitor}
                                                            label="Upload from local device"
                                                            onClick={() => { fileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }}
                                                        />
                                                        <MenuButton
                                                            icon={HardDrive}
                                                            label="Upload from system"
                                                            onClick={() => { setIsPickerModalOpen(true); setIsAttachmentMenuOpen(false); }}
                                                        />
                                                    </MenuBody>
                                                </MenuContainer>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <InputField
                                            placeholder="Type your message..."
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            disabled={isSending}
                                        />
                                        <input 
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleLocalUpload}
                                            multiple
                                        />
                                    </div>
                                    <PrimaryButton
                                        type="submit"
                                        icon={Send}
                                        disabled={!inputValue.trim() || isSending}
                                    />
                                </form>
                            </div>
                        ) : (
                            <div className="mt-auto border-t border-border bg-surface p-4 text-center">
                                <span className="text-xs font-bold uppercase text-muted">This request is {request.status.toLowerCase()}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Actions --- */}
                {request.status === DOCUMENT_REQUESTS_STATUS.OPEN && (
                    <div className="mt-auto border-t border-border bg-surface p-4 shrink-0">
                        <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-muted">Actions</span>
                        <div className="flex gap-2">
                            <PrimaryButton 
                                size="small" 
                                icon={CheckCircle} 
                                className="flex-1 justify-center"
                                onClick={() => setIsResolveModalOpen(true)}
                            >
                                Resolve
                            </PrimaryButton>
                            <DestructiveButton 
                                size="small" 
                                icon={XCircle} 
                                className="flex-1 justify-center"
                                onClick={() => setIsRejectModalOpen(true)}
                            >
                                Reject
                            </DestructiveButton>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Confirm Resolve" className="w-full max-w-sm">
                <div className="p-4 flex flex-col gap-4">
                    <p className="text-sm text-muted">
                        Are you sure you want to <strong className="text-success">resolve</strong> this request? This will mark it as completed.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setIsResolveModalOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton className="bg-success hover:bg-success-hover text-surface" onClick={handleResolveSubmit}>Confirm Resolve</PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Confirm Reject" className="w-full max-w-sm">
                <div className="p-4 flex flex-col gap-4">
                    <p className="text-sm text-muted">
                        Are you sure you want to <strong className="text-destructive">reject</strong> this request? This will mark it as denied.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setIsRejectModalOpen(false)}>Cancel</SecondaryButton>
                        <DestructiveButton onClick={handleRejectSubmit}>Confirm Reject</DestructiveButton>
                    </div>
                </div>
            </Modal>

            <DocumentPickerModal 
                isOpen={isPickerModalOpen}
                onClose={() => setIsPickerModalOpen(false)}
                onSelect={handleSystemUploadSubmit}
            />
        </aside>
    );
}
