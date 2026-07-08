import { useState } from 'react';
import { X, FileSignature, Calendar, Tag, User as UserIcon, CheckCircle, XCircle, FileText } from 'lucide-react';
import { IconButton, PrimaryButton, SecondaryButton, DestructiveButton, Badge } from '../ui';
import { Modal } from '../ui';
import { useUser, useCoordinatorRequest, useDepartment } from '../../stores';
import { COORDINATOR_REQUESTS_STATUS } from '../../constants';

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

export default function CoordinatorRequestInspector({ request, onClose }) {
    const { users } = useUser();
    const { departments } = useDepartment();
    const { update } = useCoordinatorRequest();
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const handleApproveSubmit = async () => {
        try {
            await update(request.id, { status: COORDINATOR_REQUESTS_STATUS.APPROVED });
            setIsApproveModalOpen(false);
        } catch (error) {
            console.error('Failed to approve request', error);
        }
    };

    const handleRejectSubmit = async () => {
        try {
            await update(request.id, { status: COORDINATOR_REQUESTS_STATUS.REJECTED });
            setIsRejectModalOpen(false);
        } catch (error) {
            console.error('Failed to reject request', error);
        }
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
                <div className="flex flex-col items-center gap-3 border-b border-border p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-hover text-accent">
                        <FileSignature className="size-8" />
                    </div>
                    <div>
                        <p className="break-all text-sm font-bold text-main">{request.action.replace(/_/g, ' ')}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">Coordinator Action</p>
                    </div>
                </div>

                {/* --- Tabs --- */}
                <div className="flex border-b border-border">
                    <button
                        className="flex-1 border-b-2 border-accent py-3 text-xs font-bold uppercase text-accent transition-colors"
                    >
                        Metadata
                    </button>
                </div>

                {/* --- Details --- */}
                <div className="flex-1 overflow-y-auto p-4">
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

                        {/* Requester Info */}
                        <div>
                            <div className="flex items-center gap-1.5 text-muted">
                                <UserIcon className="size-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">Requester</span>
                            </div>
                            <div className="mt-2 break-words rounded bg-surface-hover p-2 text-sm font-medium text-main">
                                {requester ? `${requester.first_name} ${requester.last_name}` : 'Unknown User'}
                            </div>
                        </div>

                        {/* Additional Data */}
                        {request.data && Object.keys(request.data).length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <FileText className="size-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Additional Data</span>
                                </div>
                                <div className="mt-2 flex flex-col gap-3 rounded bg-surface-hover p-2 text-sm text-main">
                                    {Object.entries(request.data).map(([key, value]) => {
                                        const formattedKey = key.replace(/_/g, ' ').toUpperCase();

                                        let displayValue;
                                        if (key === 'size_bytes' && typeof value === 'number') {
                                            displayValue = <span className="break-words font-medium">{formatBytes(value)}</span>;
                                        } else if (key === 'user_id' && typeof value === 'string') {
                                            const targetUser = users.find(u => u.id === value);
                                            displayValue = <span className="break-words font-medium">{targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : value}</span>;
                                        } else if (key === 'department_id' && typeof value === 'string') {
                                            const targetDept = departments.find(d => d.id === value);
                                            displayValue = <span className="break-words font-medium">{targetDept ? targetDept.name : value}</span>;
                                        } else if (typeof value === 'object' && value !== null) {
                                            displayValue = (
                                                <div className="mt-1 flex flex-col gap-1">
                                                    {Object.values(value).map((subValue, idx) => {
                                                        if (typeof subValue === 'object' && subValue !== null) {
                                                            // Handle the 'old' / 'new' change pattern
                                                            if ('old' in subValue || 'new' in subValue) {
                                                                let oldVal = subValue.old !== undefined ? String(subValue.old) : 'null';
                                                                let newVal = subValue.new !== undefined ? String(subValue.new) : 'null';

                                                                // Lookup users if these are UUIDs
                                                                if (subValue.old?.length === 36 || subValue.new?.length === 36) {
                                                                    const oldUser = users.find(u => u.id === subValue.old);
                                                                    if (oldUser) oldVal = `${oldUser.first_name} ${oldUser.last_name}`;
                                                                    const newUser = users.find(u => u.id === subValue.new);
                                                                    if (newUser) newVal = `${newUser.first_name} ${newUser.last_name}`;
                                                                }

                                                                return (
                                                                    <div key={idx} className="flex gap-2">
                                                                        <span className="break-words text-sm font-medium">
                                                                            {oldVal} <span className="mx-1 text-muted">=&gt;</span> {newVal}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }

                                                            // Fallback for other nested objects
                                                            return Object.entries(subValue).map(([innerKey, innerValue]) => {
                                                                const formattedInnerKey = innerKey.charAt(0).toUpperCase() + innerKey.slice(1).replace(/_/g, ' ');
                                                                return (
                                                                    <div key={`${idx}-${innerKey}`} className="flex gap-2">
                                                                        <span className="text-xs font-semibold text-muted">{formattedInnerKey} :</span>
                                                                        <span className="break-words text-sm font-medium">{String(innerValue)}</span>
                                                                    </div>
                                                                );
                                                            });
                                                        }
                                                        return <span key={idx} className="break-words text-sm font-medium">{String(subValue)}</span>;
                                                    })}
                                                </div>
                                            );
                                        } else {
                                            displayValue = <span className="break-words font-medium">{String(value)}</span>;
                                        }

                                        return (
                                            <div key={key} className="flex flex-col">
                                                <span className="text-xs text-muted">{formattedKey}</span>
                                                {displayValue}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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

                {/* --- Actions --- */}
                {request.status === COORDINATOR_REQUESTS_STATUS.PENDING && (
                    <div className="mt-auto border-t border-border bg-surface p-4">
                        <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-muted">Actions</span>
                        <div className="flex gap-2">
                            <PrimaryButton
                                size="small"
                                icon={CheckCircle}
                                className="flex-1 justify-center"
                                onClick={() => setIsApproveModalOpen(true)}
                            >
                                Approve
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
            <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Confirm Approve" className="w-full max-w-sm">
                <div className="p-4 flex flex-col gap-4">
                    <p className="text-sm text-muted">
                        Are you sure you want to <strong className="text-success">approve</strong> this request? This will mark it as completed.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setIsApproveModalOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton className="bg-success hover:bg-success-hover text-surface" onClick={handleApproveSubmit}>Confirm Approve</PrimaryButton>
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
        </aside>
    );
}
