import { useState } from 'react';
import { Filter } from 'lucide-react';
import { IconButton } from '../ui/Buttons';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

export default function AuditFilterMenu({ options, selectedOptions, onToggleOption, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <IconButton icon={Filter} size="medium" onClick={() => setIsOpen(!isOpen)} active={selectedOptions.length > 0 || isOpen} />
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-surface p-2 shadow-lg">
                        <span className="mb-2 block px-2 text-xs font-bold uppercase text-muted">Filter by Action</span>
                        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                            {options.map(option => (
                                <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface-hover">
                                    <input
                                        type="checkbox"
                                        className="rounded border-border text-accent focus:ring-accent"
                                        checked={selectedOptions.includes(option)}
                                        onChange={() => onToggleOption(option)}
                                    />
                                    <span className="text-sm font-medium text-main">{option.replace(/_/g, ' ')}</span>
                                </label>
                            ))}
                            {options.length === 0 && (
                                <span className="px-2 py-1 text-xs text-muted">No actions available</span>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
