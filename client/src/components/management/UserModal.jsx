import { useState, useEffect } from 'react';
import { User, Hash, Building2, Shield, Mail, Lock, Key, Camera } from 'lucide-react';
import { Modal, InputField, PasswordField, SelectField, PrimaryButton, SecondaryButton } from '../ui';
import { useUser, useDepartment, useAuthentication, useCoordinatorRequest } from '../../stores';
import { USERS_ROLE, USERS_STATUS } from '../../constants';

// ==============================================================================
// SECTION 1: COMPONENT
// ==============================================================================

export default function UserModal({ isOpen, onClose, user = null }) {
    const { create, update } = useUser();
    const { departments } = useDepartment();
    const { user: currentUser } = useAuthentication();
    const { create: createCoordinatorRequest } = useCoordinatorRequest();

    const [avatarPath, setAvatarPath] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [universityId, setUniversityId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = !!user;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && user) {
                setAvatarPath(user.avatar_path || '');
                setFirstName(user.first_name || '');
                setMiddleName(user.middle_name || '');
                setLastName(user.last_name || '');
                setUniversityId(user.university_id || '');
                setDepartmentId(user.department_id || '');
                setRole(user.role || '');
                setEmail(user.email || '');
                setPassword(''); // Never show/edit password in edit mode
            } else {
                setAvatarPath('');
                setFirstName('');
                setMiddleName('');
                setLastName('');
                setUniversityId('');
                setDepartmentId('');
                setRole('');
                setEmail('');
                setPassword('');
            }
        }
    }, [isOpen, isEditMode, user]);

    // --- Options ---
    const departmentOptions = departments.map(d => ({
        value: d.id,
        label: d.name,
        icon: Building2
    }));

    const roleOptions = Object.values(USERS_ROLE)
        .filter(r => r !== USERS_ROLE.ADMINISTRATOR)
        .map(r => ({
            value: r,
            label: r.replace(/_/g, ' '),
            icon: Shield
        }));

    // --- Handlers ---
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPath(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUniversityIdChange = (e) => {
        let raw = e.target.value.replace(/\D/g, '');
        if (raw.length > 7) raw = raw.slice(0, 7);
        if (raw.length > 2) {
            setUniversityId(`${raw.slice(0, 2)}-${raw.slice(2)}`);
        } else {
            setUniversityId(raw);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim() || !universityId.trim() || !departmentId || !role || !email.trim()) {
            return;
        }

        try {
            setIsSubmitting(true);
            if (currentUser?.role === USERS_ROLE.COORDINATOR) {
                if (isEditMode) {
                    await createCoordinatorRequest({
                        requester_id: currentUser.id,
                        action: 'USER_UPDATE',
                        data: {
                            id: user.id,
                            first_name: firstName.trim(),
                            middle_name: middleName.trim() || null,
                            last_name: lastName.trim(),
                            department_id: departmentId,
                            role: role,
                        }
                    });
                } else {
                    const finalPassword = password.trim() || universityId.trim();
                    await createCoordinatorRequest({
                        requester_id: currentUser.id,
                        action: 'USER_CREATE',
                        data: {
                            first_name: firstName.trim(),
                            middle_name: middleName.trim() || null,
                            last_name: lastName.trim(),
                            university_id: universityId.trim(),
                            department_id: departmentId,
                            role: role,
                            email: email.trim(),
                            password: finalPassword,
                            status: USERS_STATUS.PENDING_PASSWORD
                        }
                    });
                }
            } else {
                if (isEditMode) {
                    const formData = new FormData();
                    if (avatarFile) formData.append('avatar', avatarFile);
                    formData.append('first_name', firstName.trim());
                    if (middleName.trim()) formData.append('middle_name', middleName.trim());
                    formData.append('last_name', lastName.trim());
                    formData.append('department_id', departmentId);
                    formData.append('role', role);

                    await update(user.id, formData);
                } else {
                    const finalPassword = password.trim() || universityId.trim();
                    const formData = new FormData();
                    if (avatarFile) formData.append('avatar', avatarFile);
                    formData.append('first_name', firstName.trim());
                    if (middleName.trim()) formData.append('middle_name', middleName.trim());
                    formData.append('last_name', lastName.trim());
                    formData.append('university_id', universityId.trim());
                    formData.append('department_id', departmentId);
                    formData.append('role', role);
                    formData.append('email', email.trim());
                    formData.append('password', finalPassword);
                    formData.append('status', USERS_STATUS.PENDING_PASSWORD);
                    
                    await create(formData);
                }
            }
            onClose();
        } catch (error) {
            console.error('Failed to save user', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = isEditMode ? 'Edit User' : 'Add User';
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* --- Information Section --- */}
                    <div className="flex flex-col gap-4">
                        <div className="border-b border-border pb-2">
                            <h3 className="text-sm font-bold text-main">Personal Information</h3>
                            <p className="text-xs text-muted">Basic identity and organizational placement.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {currentUser?.role === USERS_ROLE.ADMINISTRATOR && (
                                <div className="flex flex-col gap-1.5 col-span-2 items-center mb-4">
                                    <label className="text-sm font-semibold text-main mb-1">Avatar Profile</label>
                                    <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-sm">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                            onChange={handleAvatarChange}
                                        />
                                        <img 
                                            src={avatarPath || '/assets/default_avatar.jpg'} 
                                            alt="Avatar" 
                                            className="w-full h-full object-cover transition-opacity group-hover:opacity-50"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/40">
                                            <Camera className="size-6 text-white" />
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted mt-1">Click to upload photo</span>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-main">First Name</label>
                                <InputField 
                                    placeholder="e.g. Juan"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-main">Middle Name</label>
                                <InputField 
                                    placeholder="Optional"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 col-span-2">
                                <label className="text-sm font-semibold text-main">Last Name</label>
                                <InputField 
                                    placeholder="e.g. Dela Cruz"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-main">University ID</label>
                                <InputField 
                                    leftIcon={Hash}
                                    placeholder="e.g. 20-00001"
                                    value={universityId}
                                    onChange={handleUniversityIdChange}
                                    pattern="^[0-9]{2}-[0-9]{5}$"
                                    title="Format: XX-XXXXX"
                                    required
                                    disabled={isEditMode}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-main">Role</label>
                                <SelectField 
                                    icon={Shield}
                                    options={roleOptions}
                                    value={role}
                                    onChange={setRole}
                                    placeholder="Select role..."
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 col-span-2">
                                <label className="text-sm font-semibold text-main">Department</label>
                                <SelectField 
                                    icon={Building2}
                                    options={departmentOptions}
                                    value={departmentId}
                                    onChange={setDepartmentId}
                                    placeholder="Select department..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- Authentication Section --- */}
                    <div className="flex flex-col gap-4">
                        <div className="border-b border-border pb-2">
                            <h3 className="text-sm font-bold text-main">Authentication</h3>
                            <p className="text-xs text-muted">Login credentials and access. Cannot be edited directly by Admin.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`flex flex-col gap-1.5 ${isEditMode ? 'col-span-2' : ''}`}>
                                <label className="text-sm font-semibold text-main">Email Address</label>
                                <InputField 
                                    leftIcon={Mail}
                                    type="email"
                                    placeholder="email@university.edu.ph"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    pattern="^[A-Za-z0-9._%+-]+@university\.edu\.ph$"
                                    title="Must be a valid @university.edu.ph email address"
                                    required
                                    disabled={isEditMode}
                                />
                            </div>

                            {!isEditMode && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-main">Temporary Password</label>
                                    <PasswordField 
                                        icon={Key}
                                        placeholder="Defaults to University ID"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <span className="text-[10px] text-muted leading-tight mt-1">
                                        If left blank, it will automatically default to the University ID. The user will be required to change it upon first login.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <div className="flex shrink-0 justify-end gap-3 p-4 border-t border-border bg-surface">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSubmitting}>
                        {isEditMode ? 'Save Changes' : 'Create User'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
