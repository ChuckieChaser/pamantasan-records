import { FolderPlus, UploadCloud } from 'lucide-react';
import { Modal } from '../ui';

export default function AddDocumentsModal({ isOpen, onClose, onSelectNewFolder, onSelectUploadFile }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Documents" className="w-full max-w-lg">
            <div className="flex gap-6 p-6">
                <button
                    className="group flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-border bg-surface p-8 transition-colors hover:border-accent hover:bg-surface-hover"
                    onClick={onSelectNewFolder}
                >
                    <div className="flex size-16 items-center justify-center rounded-full bg-surface-hover text-muted group-hover:bg-accent/10 group-hover:text-accent">
                        <FolderPlus className="size-8" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-lg font-bold text-main group-hover:text-accent">New Folder</span>
                        <span className="mt-1 text-sm text-muted">Create a new empty folder</span>
                    </div>
                </button>

                <button
                    className="group flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-border bg-surface p-8 transition-colors hover:border-accent hover:bg-surface-hover"
                    onClick={onSelectUploadFile}
                >
                    <div className="flex size-16 items-center justify-center rounded-full bg-surface-hover text-muted group-hover:bg-accent/10 group-hover:text-accent">
                        <UploadCloud className="size-8" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-lg font-bold text-main group-hover:text-accent">Upload File</span>
                        <span className="mt-1 text-sm text-muted">Upload files or folders from your computer</span>
                    </div>
                </button>
            </div>
        </Modal>
    );
}
