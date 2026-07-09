import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuthentication, useUser } from '../stores';

export default function Onboarding() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthentication();
    const { update } = useUser();

    // PENDING_PASSWORD states
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        try {
            const updatedUser = await update(user.id, {
                status: 'PENDING_SSO',
                password: password
            });
            updateUser(updatedUser);
            // State update will trigger re-render to the next step
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipSSO = async () => {
        setIsLoading(true);
        try {
            const updatedUser = await update(user.id, {
                status: 'VERIFIED'
            });
            updateUser(updatedUser);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to update status');
            setIsLoading(false);
        }
    };

    // If user is already verified, they shouldn't be here
    useEffect(() => {
        if (user?.status === 'VERIFIED') {
            navigate('/dashboard');
        }
    }, [user?.status, navigate]);

    if (user?.status === 'VERIFIED') {
        return null;
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-background text-accent">
                    <ShieldCheck className="size-7" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-main">Account Setup</h1>
                    <p className="mt-1 text-sm text-muted">Complete your profile to continue.</p>
                </div>
            </div>

            {user?.status === 'PENDING_PASSWORD' && (
                <form
                    onSubmit={handlePasswordSubmit}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm"
                >
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-main">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm text-main placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main transition-colors"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-main">
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-main placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-error-border bg-error-background px-3 py-2 text-sm text-error-text">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Save Password'}
                    </button>
                </form>
            )}

            {user?.status === 'PENDING_SSO' && (
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm text-center">
                    <div className="flex justify-center text-accent mb-2">
                        <CheckCircle2 className="size-12" />
                    </div>
                    <h2 className="text-lg font-semibold text-main">Password Updated</h2>
                    <p className="text-sm text-muted">
                        Your next step is to set up Google Authenticator. Since this feature is currently unavailable, you may skip this step.
                    </p>

                    {error && (
                        <p className="rounded-lg border border-error-border bg-error-background px-3 py-2 text-sm text-error-text">
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleSkipSSO}
                        disabled={isLoading}
                        className="mt-4 flex h-10 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-main transition-colors hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : 'Skip for Now'}
                    </button>
                </div>
            )}
        </div>
    );
}
