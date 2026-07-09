import { useState, useMemo } from 'react';
import { useAuthentication, useDocument } from '../../stores';
import { Modal, InputField, PrimaryButton, SecondaryButton, DestructiveButton } from '../ui';
import { Folder, AlertCircle } from 'lucide-react';

export default function NewFolderModal({ isOpen, onClose, currentFolderId, currentPathSegments }) {
    const { user } = useAuthentication();
    const { create: createDocument } = useDocument();
    
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [conflictState, setConflictState] = useState(false);

    // Provide a visual path string from segments
    const pathString = useMemo(() => {
        if (!currentPathSegments || currentPathSegments.length === 0) return 'Home /';
        const labels = currentPathSegments.map(s => typeof s === 'string' ? s : s.label);
        return 'Home / ' + labels.join(' / ');
    }, [currentPathSegments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Check for conflict
        const { documents } = useDocument.getState();
        const conflict = documents.some(d => 
            !d.is_archived && 
            d.parent_id === (currentFolderId || null) && 
            d.name.toLowerCase() === name.trim().toLowerCase()
        );
        
        if (conflict) {
            setConflictState(true);
            return;
        }

        await executeCreate(name.trim());
    };

    const executeCreate = async (finalName) => {
        setIsSubmitting(true);
        try {
            await createDocument({
                name: finalName,
                is_folder: true,
                parent_id: currentFolderId || null,
                uploader_id: user.id,
            });
            
            handleClose();
        } catch (error) {
            console.error('Failed to create folder', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName('');
        setConflictState(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Folder" className="w-full max-w-md">
            {conflictState ? (
                <div className="flex flex-col items-center justify-center p-6 gap-6">
                    <div className="flex flex-col items-center text-center gap-2 max-w-md">
                        <AlertCircle className="size-12 text-error mb-2" />
                        <h3 className="text-xl font-bold text-main">Name Already Exists</h3>
                        <p className="text-sm text-muted">
                            A folder or file named <strong>{name.trim()}</strong> already exists in this location.
                        </p>
                        <p className="text-sm text-main mt-2">What would you like to do?</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full max-w-sm">
                        <SecondaryButton onClick={() => executeCreate(`${name.trim()} (1)`)} className="w-full justify-center">
                            Continue (Rename to (1))
                        </SecondaryButton>
                        <DestructiveButton onClick={handleClose} className="w-full justify-center">
                            Skip
                        </DestructiveButton>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-main">Folder Path</label>
                            <InputField
                                value={pathString}
                                disabled
                                className="bg-surface-hover opacity-70"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-main">Folder Name</label>
                            <InputField
                                leftIcon={Folder}
                                placeholder="e.g. Q1 Reports"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                        <SecondaryButton type="button" onClick={handleClose} disabled={isSubmitting}>Cancel</SecondaryButton>
                        <PrimaryButton type="submit" disabled={isSubmitting || !name.trim()}>Create Folder</PrimaryButton>
                    </div>
                </form>
            )}
        </Modal>
    );
}
