import { useState } from 'react';
import { X, Building2, Calendar, Edit } from 'lucide-react';
import { IconButton, PrimaryButton } from '../ui';
import DepartmentModal from './DepartmentModal';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

export default function DepartmentInspector({ department, onClose }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!department) return null;

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
                        <Building2 className="size-8" />
                    </div>
                    <div>
                        <p className="break-all text-sm font-bold text-main">{department.name}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{department.code}</p>
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
                        {/* Dates */}
                        <div>
                            <div className="flex items-center gap-1.5 text-muted">
                                <Calendar className="size-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">Dates</span>
                            </div>
                            <div className="mt-2 flex flex-col gap-2 rounded bg-surface-hover p-2 text-sm text-main">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted">Created</span>
                                    <span className="font-medium">{new Date(department.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted">Modified</span>
                                    <span className="font-medium">{new Date(department.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Actions --- */}
                <div className="mt-auto border-t border-border bg-surface p-4">
                    <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-muted">Actions</span>
                    <div className="flex flex-col gap-2">
                        <PrimaryButton
                            size="small"
                            icon={Edit}
                            className="w-full justify-center"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Edit Department
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            <DepartmentModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                department={department}
            />
        </aside>
    );
}
