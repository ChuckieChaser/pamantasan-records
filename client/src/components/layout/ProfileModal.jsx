import { useEffect } from 'react';
import { useAuthentication, useDepartment } from '../../stores';
import { Modal, Badge } from '../ui';
import avatar from '../../assets/avatar.png';

export default function ProfileModal({ isOpen, onClose }) {
    const { user } = useAuthentication();
    const { departments, getAll: getDepartments } = useDepartment();

    useEffect(() => {
        if (isOpen) {
            getDepartments();
        }
    }, [isOpen]);

    if (!user) return null;

    const userDepartment = departments.find((d) => d.id === user.department_id);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="User Profile" className="w-full max-w-lg">
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-6">
                    <div className="size-24 shrink-0 overflow-hidden rounded-full border border-border">
                        <img src={user.avatar_path || avatar} alt="Profile" className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-main">
                            {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-sm text-muted">{user.email}</p>
                        <div className="mt-3 flex gap-2">
                            <Badge label={user.role} variant="accent" size="small" />
                            <Badge label={user.status} variant={user.status === 'VERIFIED' ? 'success' : 'warning'} size="small" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 rounded-md border border-border bg-surface-hover p-4 shadow-inner">
                    <div className="border-b border-border pb-4">
                        <h4 className="text-sm font-bold text-main">Overview Details</h4>
                        <p className="mt-1 text-xs text-muted">Read-only system information tied to your account.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6">
                        <div>
                            <span className="block text-xs font-semibold text-muted">University ID</span>
                            <span className="mt-1 block text-sm font-medium text-main">{user.university_id}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-muted">Department</span>
                            <span className="mt-1 block text-sm font-medium text-main">
                                {userDepartment ? userDepartment.name : 'Loading...'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
