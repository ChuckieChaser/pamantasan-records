import { useState, useEffect } from 'react';
import { Building2, Hash } from 'lucide-react';
import { Modal, InputField, PrimaryButton, SecondaryButton } from '../ui';
import { useDepartment } from '../../stores';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

export default function DepartmentModal({ isOpen, onClose, department = null }) {
    const { create, update } = useDepartment();
    
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = !!department;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && department) {
                setName(department.name || '');
                setCode(department.code || '');
            } else {
                setName('');
                setCode('');
            }
        }
    }, [isOpen, isEditMode, department]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !code.trim()) return;

        try {
            setIsSubmitting(true);
            if (isEditMode) {
                await update(department.id, {
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                });
            } else {
                await create({
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                });
            }
            onClose();
        } catch (error) {
            console.error('Failed to save department', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = isEditMode ? 'Edit Department' : 'Add Department';
    const subtitle = isEditMode ? 'Modify the details of the selected department.' : 'Create a new department in the system.';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
                <div>
                    <p className="text-sm text-muted">{subtitle}</p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-main">Department Name</label>
                        <InputField 
                            leftIcon={Building2}
                            placeholder="e.g. College of Science"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-main">Department Code</label>
                        <InputField 
                            leftIcon={Hash}
                            placeholder="e.g. COS"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={!name.trim() || !code.trim() || isSubmitting}>
                        {isEditMode ? 'Save Changes' : 'Create Department'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
