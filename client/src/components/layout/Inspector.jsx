import { FileText, Folder, Info, X } from 'lucide-react';
import { IconButton } from '../ui';

// ==============================================================================
// SECTION 1: INSPECTOR
// ==============================================================================

// --- Inspector: layout panel = top-level container → no rounded corners (full-height flush border) ---
const Inspector = ({ document, onClose }) => {
    return (
        <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-surface">
            {/* --- Header --- */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
                <h2 className="text-sm font-bold text-main">Inspector</h2>
                <IconButton icon={X} size="small" onClick={onClose} />
            </div>

            {/* --- Body --- */}
            {document ? (
                <div className="flex flex-col gap-6 overflow-y-auto p-4">
                    {/* --- Identity --- */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        {/* --- Icon container: rounded-md (child of the panel) --- */}
                        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-hover text-muted">
                            {document.is_folder
                                ? <Folder className="size-8 fill-accent text-accent" />
                                : <FileText className="size-8" />}
                        </div>
                        <div>
                            <p className="break-all text-sm font-medium text-main">{document.name}</p>
                            <p className="mt-1 text-xs text-muted">{document.is_folder ? 'Folder' : 'File'}</p>
                        </div>
                    </div>

                    {/* --- Metadata --- */}
                    <div className="flex flex-col gap-4 border-t border-border pt-4">
                        <div>
                            <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
                                Status
                            </span>
                            <span className="mt-1 block text-sm font-medium text-main">
                                {document.status.replace(/_/g, ' ')}
                            </span>
                        </div>

                        {document.summary && (
                            <div>
                                <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
                                    Summary
                                </span>
                                {/* --- Info block: rounded-sm (grandchild of metadata section) --- */}
                                <div className="mt-2 flex items-start gap-2 rounded-sm bg-surface-hover p-2 text-sm text-main">
                                    <Info className="mt-1 size-4 shrink-0 text-accent" />
                                    <p className="leading-relaxed">{document.summary}</p>
                                </div>
                            </div>
                        )}

                        {document.comment && (
                            <div>
                                <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
                                    Comment
                                </span>
                                <p className="mt-1 text-sm leading-relaxed text-main">{document.comment}</p>
                            </div>
                        )}

                        <div>
                            <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
                                Dates
                            </span>
                            <div className="mt-1 flex flex-col gap-1 text-sm text-main">
                                <span>
                                    <span className="text-muted">Created: </span>
                                    {new Date(document.created_at).toLocaleDateString()}
                                </span>
                                <span>
                                    <span className="text-muted">Modified: </span>
                                    {new Date(document.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
                    <FileText className="size-10 text-border" />
                    <p className="text-sm text-muted">Select a document to view its details here.</p>
                </div>
            )}
        </aside>
    );
};

export default Inspector;
