import { useState } from 'react';
import { X, User as UserIcon, Calendar, Edit, Building2, Tag, Shield, Mail, Hash } from 'lucide-react';
import { IconButton, PrimaryButton, DestructiveButton, SecondaryButton, Modal } from '../ui';
import UserModal from './UserModal';
import { useDepartment, useUser } from '../../stores';
import { USERS_STATUS } from '../../constants';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

export default function UserInspector({ user, onClose }) {
    const { departments } = useDepartment();
    const { update } = useUser();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [isUnsuspendModalOpen, setIsUnsuspendModalOpen] = useState(false);

    const handleSuspend = async () => {
        try {
            await update(user.id, { status: USERS_STATUS.SUSPENDED });
            setIsSuspendModalOpen(false);
        } catch (error) {
            console.error('Failed to suspend user', error);
        }
    };

    const handleUnsuspend = async () => {
        try {
            // Un-suspending defaults to VERIFIED usually, or whatever is proper.
            await update(user.id, { status: USERS_STATUS.VERIFIED });
            setIsUnsuspendModalOpen(false);
        } catch (error) {
            console.error('Failed to unsuspend user', error);
        }
    };

    if (!user) return null;

    const department = departments.find(d => d.id === user.department_id);

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
                    <img
                        src={user.avatar_path || '/assets/default_avatar.jpg'}
                        alt="Avatar"
                        className="h-16 w-16 rounded-full object-cover shadow-sm"
                    />
                    <div>
                        <p className="break-all text-sm font-bold text-main">{user.first_name} {user.last_name}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{user.role.replace(/_/g, ' ')}</p>
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
                                {user.status.replace(/_/g, ' ')}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <div className="flex items-center gap-1.5 text-muted">
                                <Mail className="size-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">Email Address</span>
                            </div>
                            <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main truncate">
                                {user.email}
                            </div>
                        </div>

                        {/* University ID */}
                        <div>
                            <div className="flex items-center gap-1.5 text-muted">
                                <Hash className="size-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">University ID</span>
                            </div>
                            <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium font-mono text-main truncate">
                                {user.university_id}
                            </div>
                        </div>

                        {/* Department */}
                        <div>
                            <div className="flex items-center gap-1.5 text-muted">
                                <Building2 className="size-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">Department</span>
                            </div>
                            <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main truncate">
                                {department ? department.name : 'Unknown Department'}
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <div className="flex items-center gap-1.5 text-muted">
                                <Shield className="size-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">Role</span>
                            </div>
                            <div className="mt-2 rounded bg-surface-hover p-2 text-sm font-medium text-main truncate">
                                {user.role.replace(/_/g, ' ')}
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
                                    <span className="text-xs text-muted">Registered</span>
                                    <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted">Last Updated</span>
                                    <span className="font-medium">{new Date(user.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Actions --- */}
                <div className="mt-auto border-t border-border bg-surface p-4">
                    <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-muted">Actions</span>
                    <div className="flex gap-2">
                        <PrimaryButton
                            size="small"
                            icon={Edit}
                            className="flex-1 justify-center"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Edit
                        </PrimaryButton>
                        {user.status === 'SUSPENDED' ? (
                            <PrimaryButton
                                size="small"
                                className="flex-1 justify-center bg-success hover:bg-success-hover text-surface"
                                onClick={() => setIsUnsuspendModalOpen(true)}
                            >
                                Unsuspend
                            </PrimaryButton>
                        ) : (
                            <DestructiveButton
                                size="small"
                                className="flex-1 justify-center"
                                onClick={() => setIsSuspendModalOpen(true)}
                            >
                                Suspend
                            </DestructiveButton>
                        )}
                    </div>
                </div>
            </div>

            <UserModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
            />

            <Modal isOpen={isSuspendModalOpen} onClose={() => setIsSuspendModalOpen(false)} title="Confirm Suspend" className="w-full max-w-sm">
                <div className="p-4 flex flex-col gap-4">
                    <p className="text-sm text-muted">
                        Are you sure you want to <strong className="text-destructive">suspend</strong> this user? They will not be able to log in or perform any actions.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setIsSuspendModalOpen(false)}>Cancel</SecondaryButton>
                        <DestructiveButton onClick={handleSuspend}>Confirm Suspend</DestructiveButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isUnsuspendModalOpen} onClose={() => setIsUnsuspendModalOpen(false)} title="Confirm Unsuspend" className="w-full max-w-sm">
                <div className="p-4 flex flex-col gap-4">
                    <p className="text-sm text-muted">
                        Are you sure you want to <strong className="text-success">unsuspend</strong> this user? They will regain their normal access.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setIsUnsuspendModalOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton className="bg-success hover:bg-success-hover text-surface" onClick={handleUnsuspend}>Confirm Unsuspend</PrimaryButton>
                    </div>
                </div>
            </Modal>
        </aside>
    );
}
