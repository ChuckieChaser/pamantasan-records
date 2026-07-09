import { useState, useMemo } from 'react';
import { useAuthentication, useDocument, useDocumentVersion } from '../../stores';
import { Modal, InputField, PrimaryButton, SecondaryButton } from '../ui';
import { Folder } from 'lucide-react';
import { DOCUMENTS_STATUS } from '../../constants';

export default function NewFolderModal({ isOpen, onClose, currentFolderId, currentPathSegments }) {
    const { user } = useAuthentication();
    const { create: createDocument } = useDocument();
    const { create: createDocumentVersion } = useDocumentVersion();
    
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        const conflict = documents.some(d => d.parent_id === (currentFolderId || null) && d.name.toLowerCase() === name.trim().toLowerCase());
        if (conflict) {
            alert('A folder or file with this name already exists here.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createDocument({
                name: name.trim(),
                is_folder: true,
                parent_id: currentFolderId || null,
                uploader_id: user.id,
                status: DOCUMENTS_STATUS.UPLOADED, 
            });
            
            setName('');
            onClose();
        } catch (error) {
            console.error('Failed to create folder', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Folder" className="w-full max-w-md">
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
                    <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSubmitting || !name.trim()}>Create Folder</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
