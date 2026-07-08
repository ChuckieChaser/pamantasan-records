import { X, AlertCircle } from 'lucide-react';
import { IconButton, PrimaryButton, DestructiveButton, SecondaryButton } from './Buttons';
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
                        {onClose && <IconButton icon={X} onClick={onClose} />}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};

// --- Confirm Action Modal ---
export const ConfirmActionModal = ({ isOpen, onClose, title, description, confirmText = 'Confirm', onConfirm, isDestructive = false }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} className="w-full max-w-md">
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-2 ${isDestructive ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'}`}>
                        <AlertCircle className="size-5" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-main">{description}</p>
                    </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    {isDestructive ? (
                        <DestructiveButton onClick={() => { onConfirm(); onClose(); }}>{confirmText}</DestructiveButton>
                    ) : (
                        <PrimaryButton onClick={() => { onConfirm(); onClose(); }}>{confirmText}</PrimaryButton>
                    )}
                </div>
            </div>
        </Modal>
    );
};
