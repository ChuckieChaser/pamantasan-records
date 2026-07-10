import { FileText, Download, ExternalLink } from 'lucide-react';
import { Modal } from '../ui';
import { useDocumentViewer, useDocumentVersion } from '../../stores';
import { useMemo } from 'react';
import { documentsApi } from '../../services';

// ==============================================================================
// SECTION 1: MODAL
// ==============================================================================

const PDF_TYPES = ['application/pdf'];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const TEXT_TYPES = ['text/plain', 'text/csv', 'text/markdown', 'text/html', 'application/json'];

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;

export default function ViewDocumentModal() {
    const { isOpen, document, closeViewer } = useDocumentViewer();
    const { documentVersions } = useDocumentVersion();

    const latestVersion = useMemo(() => {
        if (!document) return null;
        const docVers = documentVersions.filter(v => v.document_id === document.id);
        if (docVers.length === 0) return null;
        return docVers.reduce((max, v) => v.version > max.version ? v : max, docVers[0]);
    }, [document, documentVersions]);

    const mimeType = latestVersion?.mime_type || '';
    const isPDF = PDF_TYPES.includes(mimeType);
    const isImage = IMAGE_TYPES.some(t => mimeType === t);
    const isText = TEXT_TYPES.some(t => mimeType === t);
    
    const viewUrl = useMemo(() => {
        if (!document) return null;
        let url = `${API_BASE}/api/documents/${document.id}/view`;
        try {
            const raw = localStorage.getItem('pamantasan_user');
            if (raw) {
                const user = JSON.parse(raw);
                url += `?userId=${user.id}&role=${user.role}&deptId=${user.department_id}`;
            }
        } catch(e) {}
        return url;
    }, [document]);
    const handleDownload = async () => {
        if (!document) return;
        try {
            const blob = await documentsApi.download(document.id);
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = document.name;
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download', err);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeViewer}
            title={`Viewing: ${document?.name || 'Document'}`}
            className="w-full max-w-5xl h-[85vh]"
        >
            <div className="flex flex-col flex-1 overflow-hidden m-4 rounded-lg border border-border">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
                    <span className="text-xs text-muted font-medium">{mimeType || 'Unknown type'}</span>
                    <div className="flex items-center gap-4">
                        {viewUrl && (
                            <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
                                <ExternalLink className="size-3.5" /> Open in browser
                            </a>
                        )}
                        <button onClick={handleDownload}
                            className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
                            <Download className="size-3.5" /> Download
                        </button>
                    </div>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-hidden bg-surface-hover">
                    {(isPDF || isText) && viewUrl ? (
                        <iframe src={viewUrl} title={document?.name} className="w-full h-full border-0 bg-white" />
                    ) : isImage && viewUrl ? (
                        <div className="flex items-center justify-center h-full overflow-auto p-4">
                            <img src={viewUrl} alt={document?.name} className="max-w-full max-h-full object-contain rounded" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                            <FileText className="size-16 text-muted opacity-40" />
                            <div className="text-center">
                                <p className="text-main font-semibold mb-1">{document?.name}</p>
                                <p className="text-muted text-sm mb-4">
                                    {mimeType ? `This file type (${mimeType}) cannot be previewed in the browser.` : 'No preview available.'}
                                </p>
                                <button onClick={handleDownload}
                                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity">
                                    <Download className="size-4" /> Download to view
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
