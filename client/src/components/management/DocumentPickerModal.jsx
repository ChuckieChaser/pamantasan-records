import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Folder } from 'lucide-react';
import { Modal, InputField, PrimaryButton, SecondaryButton } from '../ui';
import { useDocument } from '../../stores';

export default function DocumentPickerModal({ isOpen, onClose, onSelect }) {
    const { documents, getAll } = useDocument();
    const [filter, setFilter] = useState('');
    const [selectedDocId, setSelectedDocId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            getAll();
            setFilter('');
            setSelectedDocId(null);
        }
    }, [isOpen, getAll]);

    const displayDocuments = useMemo(() => {
        let result = documents || [];
        if (filter) {
            result = result.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()));
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [documents, filter]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedDocId) {
            onSelect(selectedDocId);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Document" className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                <p className="text-sm text-muted">Select a document or folder from the system to attach.</p>
                
                <InputField
                    leftIcon={Search}
                    placeholder="Search documents..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />

                <div className="flex flex-col gap-1 overflow-y-auto max-h-64 rounded border border-border p-2 bg-surface">
                    {displayDocuments.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted">No documents found.</div>
                    ) : (
                        displayDocuments.map(doc => {
                            const isSelected = selectedDocId === doc.id;
                            const Icon = doc.is_folder ? Folder : FileText;
                            return (
                                <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => setSelectedDocId(doc.id)}
                                    className={`flex items-center gap-3 p-3 rounded text-sm transition-colors text-left ${isSelected ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-surface-hover text-main'}`}
                                >
                                    <Icon className={`size-4 ${isSelected ? 'text-accent' : 'text-muted'}`} />
                                    <span className="truncate">{doc.name}</span>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={!selectedDocId}>Attach Selected</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
