import { useState } from 'react';
import { Filter } from 'lucide-react';
import { IconButton } from '../ui/Buttons';
import { DOCUMENTS_STATUS } from '../../constants';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

// --- FilterMenu: Status filter dropdown for document browser sections ---
export default function FilterMenu({ selectedStatuses, onToggleStatus, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <IconButton icon={Filter} size="medium" onClick={() => setIsOpen(!isOpen)} active={selectedStatuses.length > 0 || isOpen} />
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-surface p-2 shadow-lg">
                        <span className="mb-2 block px-2 text-xs font-bold uppercase text-muted">Filter by Status</span>
                        {Object.values(DOCUMENTS_STATUS).map(status => (
                            <label key={status} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface-hover">
                                <input
                                    type="checkbox"
                                    className="rounded border-border text-accent focus:ring-accent"
                                    checked={selectedStatuses.includes(status)}
                                    onChange={() => onToggleStatus(status)}
                                />
                                <span className="text-sm font-medium text-main">{status.replace(/_/g, ' ')}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
