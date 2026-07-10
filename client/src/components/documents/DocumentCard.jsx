import { Card, CardBody } from '../ui/Containers';
import { getFileIcon } from '../ui/FileIcon';
import { Share2, Archive, XCircle, CheckCircle, MessageSquare } from 'lucide-react';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

// --- DocumentCard: single card in the grid card view for any document browser ---
export default function DocumentCard({ document, latestVersion, isSelected, onClick, onDoubleClick, isShared, hasRejected, hasApproved, hasComment, authorName }) {
    return (
        <Card
            className={`group cursor-pointer transition-colors duration-200 border ${isSelected ? 'border-accent bg-surface-hover' : 'border-transparent hover:bg-surface-hover'}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            <CardBody className="flex min-w-0 flex-col gap-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${isSelected ? 'bg-background text-accent' : 'bg-surface-hover text-muted group-hover:bg-background group-hover:text-accent'}`}>
                        {getFileIcon(document.is_folder, latestVersion?.mime_type, 'size-5')}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                            <span className={`block break-words font-bold line-clamp-2 transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-main group-hover:text-accent'}`}>
                                {document.name}
                            </span>
                            <div className="flex shrink-0 gap-1 mt-1">
                                {document.is_archived ? <Archive className="size-3.5 text-muted" /> : (isShared && <Share2 className="size-3.5 text-muted" />)}
                                {hasRejected ? <XCircle className="size-3.5 text-muted" /> : (hasApproved ? <CheckCircle className="size-3.5 text-muted" /> : null)}
                                {hasComment && <MessageSquare className="size-3.5 text-muted" />}
                            </div>
                        </div>
                        <span className="text-xs text-muted truncate">
                            {authorName} • {document.is_folder ? '-' : `v${latestVersion?.version || 1}`}
                        </span>
                    </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs font-semibold text-muted">Modified: {new Date(document.updated_at).toLocaleString()}</span>
                </div>
            </CardBody>
        </Card>
    );
}
