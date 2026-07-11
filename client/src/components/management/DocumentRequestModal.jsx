import { useState } from 'react';
import { Send } from 'lucide-react';
import { Modal, InputField, TextArea, PrimaryButton, SecondaryButton } from '../ui';
import { useAuthentication, useDocumentRequest } from '../../stores';

export default function DocumentRequestModal({ isOpen, onClose, onCreated }) {
    const { user } = useAuthentication();
    const { create } = useDocumentRequest();
    
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !user) return;
        
        setIsSubmitting(true);
        try {
            const combinedSubject = description.trim() ? `${subject.trim()}\n\n${description.trim()}` : subject.trim();
            const newReq = await create({
                requester_id: user.id,
                subject: combinedSubject,
            });
            setSubject('');
            setDescription('');
            onClose();
            if (onCreated) onCreated(newReq.id);
        } catch (error) {
            console.error('Failed to create request', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Document Request" className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                <p className="text-sm text-muted">
                    Submit a ticket to request a document from the administration or coordinators.
                </p>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-muted">Subject</label>
                    <InputField 
                        placeholder="E.g., Request for Q3 Financial Report"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-muted">Description (Optional)</label>
                    <TextArea 
                        placeholder="Provide any additional details or context for your request..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                        rows={4}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" icon={Send} disabled={!subject.trim() || isSubmitting}>
                        Submit Request
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
