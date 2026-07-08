import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { useAuthentication } from '../stores';
import { PrimaryButton, SecondaryButton } from '../components/ui';

import {
    ADMINISTRATOR_ID,
    COORDINATOR_ID,
    DIRECTOR_ID,
    OFFICER_ID,
    MEMBER_ID,
    HR_MEMBER_ID,
} from '../mocks/data';

// ==============================================================================
// SECTION 1: QUICK-ACCESS ROLE CONFIG
// ==============================================================================

// --- Administrator and Coordinator: primary access (uploaders / managers) ---
const PRIMARY_ROLES = [
    { label: 'Login as Administrator', userId: ADMINISTRATOR_ID },
    { label: 'Login as Coordinator', userId: COORDINATOR_ID },
];

// --- Other roles: secondary access (approvers / requesters) ---
const SECONDARY_ROLES = [
    { label: 'Login as Director', userId: DIRECTOR_ID },
    { label: 'Login as Officer', userId: OFFICER_ID },
    { label: 'Login as Member (CCS)', userId: MEMBER_ID },
    { label: 'Login as Member (HR)', userId: HR_MEMBER_ID },
];

// ==============================================================================
// SECTION 2: PAGE
// ==============================================================================

// --- Login card: container → rounded-lg + shadow-sm ---
export default function Login() {
    const navigate = useNavigate();
    const { login, isLoading } = useAuthentication();

    const handleLogin = async (userId) => {
        await login(userId);
        navigate('/dashboard');
    };

    return (
        <div className="flex w-full max-w-xs flex-col rounded-lg border border-border bg-surface shadow-sm">
            {/* --- Identity --- */}
            <div className="flex flex-col items-center gap-4 text-center p-4 pb-2">
                {/* --- Icon well: rounded-md (child container) --- */}
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-accent-background text-accent">
                    <ShieldCheck className="size-7" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-main">Records Management</h1>
                    <p className="mt-1 text-xs text-muted">Select a role to enter the workspace.</p>
                </div>
            </div>

            {/* --- Primary Roles --- */}
            <div className="flex flex-col gap-2 p-4 pt-2 pb-2">
                {PRIMARY_ROLES.map((role) => (
                    <PrimaryButton
                        key={role.userId}
                        size="medium"
                        disabled={isLoading}
                        onClick={() => handleLogin(role.userId)}
                    >
                        {role.label}
                    </PrimaryButton>
                ))}
            </div>

            {/* --- Divider --- */}
            <div className="flex items-center gap-3 px-4 py-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted">Other roles</span>
                <div className="h-px flex-1 bg-border" />
            </div>

            {/* --- Secondary Roles --- */}
            <div className="flex flex-col gap-2 p-4 pt-2">
                {SECONDARY_ROLES.map((role) => (
                    <SecondaryButton
                        key={role.userId}
                        size="medium"
                        disabled={isLoading}
                        onClick={() => handleLogin(role.userId)}
                    >
                        {role.label}
                    </SecondaryButton>
                ))}
            </div>
        </div>
    );
}
