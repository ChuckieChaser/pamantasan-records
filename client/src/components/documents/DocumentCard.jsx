import { Card, CardBody } from '../ui/Containers';
import { Badge } from '../ui/Badges';
import { getFileIcon } from '../ui/FileIcon';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

// --- DocumentCard: single card in the grid card view for any document browser ---
export default function DocumentCard({ document, latestVersion, isSelected, onClick, onDoubleClick, isShared }) {
    return (
        <Card
            className={`cursor-pointer transition-colors duration-200 ${isSelected ? 'border-accent bg-surface-hover ring-1 ring-accent' : 'hover:border-accent'}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            <CardBody className="flex min-w-0 flex-col gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-background text-accent' : 'bg-surface-hover text-muted'}`}>
                        {getFileIcon(document.is_folder, latestVersion?.mime_type, 'size-5')}
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className={`block break-words font-bold line-clamp-2 transition-colors ${isSelected ? 'text-accent' : 'text-main'}`}>
                            {document.name}
                        </span>
                    </div>
                    {isShared && (
                        <div className="flex-shrink-0" title="This document is shared">
                            <Badge label="Shared" variant="success" size="small" />
                        </div>
                    )}
                </div>
                <div className="mt-auto flex items-center justify-between">
                    <Badge label={document.status} variant="neutral" size="small" />
                    <span className="text-xs font-semibold text-muted">{new Date(document.updated_at).toLocaleDateString()}</span>
                </div>
            </CardBody>
        </Card>
    );
}
