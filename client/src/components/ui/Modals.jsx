import { X } from 'lucide-react';
import { IconButton } from './Buttons';
import { DimBackdrop } from './Backdrops';

// ==============================================================================
// SECTION 1: MODAL
// ==============================================================================

// --- Modal Container: rounded-lg (large category) ---
export const Modal = ({ isOpen, onClose, title, className = '', children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DimBackdrop onClick={onClose} />

            {/* Modal Body: rounded-lg, shadow-lg, relative above backdrop */}
            <div className={`relative flex z-60 max-h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg ${className}`}>
                {title && (
                    <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
                        <h2 className="text-lg font-bold text-main">{title}</h2>
                        {onClose && <IconButton icon={X} size="small" onClick={onClose} />}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};
