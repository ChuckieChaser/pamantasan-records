import { FileText } from 'lucide-react';
import { Modal } from '../ui';
import { useDocumentViewer } from '../../stores';

// ==============================================================================
// SECTION 1: MODAL
// ==============================================================================

export default function ViewDocumentModal() {
    const { isOpen, document, closeViewer } = useDocumentViewer();

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={closeViewer} 
            title={`Viewing: ${document?.name || 'Document'}`} 
            className="w-full max-w-4xl h-[80vh]"
        >
            <div className="flex-1 bg-surface-hover p-8 m-4 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center overflow-y-auto">
                <FileText className="size-16 text-muted mb-4 opacity-50" />
                <p className="text-muted text-center max-w-md leading-relaxed">
                    This is a placeholder for the actual document content. In a real application, a PDF viewer, image renderer, or file previewer would be embedded here to display the contents of <strong className="text-main">{document?.name}</strong>.
                </p>
            </div>
        </Modal>
    );
}
