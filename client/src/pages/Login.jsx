import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { useAuthentication } from '../stores';

// ==============================================================================
// LOGIN PAGE
// Real email/university_id + password form.
// All test users have the password: "password"
// ==============================================================================

export default function Login() {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuthentication();

    const [universityId, setUniversityId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(universityId.trim(), password);
            navigate('/dashboard');
        } catch (err) {
            // Error is caught here to prevent unhandled rejection.
            // The actual error message is handled by the useAuthentication store's state.
        }
    };

    return (
        <div className="flex w-full max-w-sm flex-col gap-6">
            {/* --- Identity --- */}
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-background text-accent">
                    <ShieldCheck className="size-7" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-main">Records Management</h1>
                    <p className="mt-1 text-sm text-muted">Sign in to your account to continue.</p>
                </div>
            </div>

            {/* --- Form --- */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
                {/* University ID */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="university_id" className="text-sm font-medium text-main">
                        University ID
                    </label>
                    <input
                        id="university_id"
                        type="text"
                        value={universityId}
                        onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length > 2) {
                                val = val.substring(0, 2) + '-' + val.substring(2);
                            }
                            if (val.length > 8) {
                                val = val.substring(0, 8);
                            }
                            setUniversityId(val);
                        }}
                        placeholder="e.g. 20-00001"
                        required
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-main placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-main">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
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

                {/* Error */}
                {error && (
                    <p className="rounded-lg border border-error-border bg-error-background px-3 py-2 text-sm text-error-text">
                        {error}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-10 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
        </div>
    );
}
