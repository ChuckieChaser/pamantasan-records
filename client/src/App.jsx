import { useEffect } from 'react';
import { USER_SETTINGS_THEME } from './constants';
import { useAuthentication } from './stores/useAuthentication';
import { Loader2, ShieldCheck, Building, Fingerprint } from 'lucide-react';

export default function App() {
    const initialize = useAuthentication((state) => state.initialize);
    const isLoading = useAuthentication((state) => state.isLoading);
    const user = useAuthentication((state) => state.user);
    const theme = useAuthentication((state) => state.theme);

    useEffect(() => {
        theme === USER_SETTINGS_THEME.DARK ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
    }, [theme]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    // The Shield: Now with a premium loading spinner
    if (isLoading) {
        return (
            <div className="flex flex-col h-screen w-screen items-center justify-center bg-background text-muted gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="font-medium tracking-wide animate-pulse">Authenticating Workspace...</p>
            </div>
        );
    }

    // The UI: Centered, elevated, and utilizing your custom fonts and theme
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-accent selection:text-surface">
            {/* Main Card Container */}
            <div className="max-w-md w-full bg-surface rounded-2xl shadow-xl border border-border overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                {/* Header Section */}
                <div className="bg-surface-hover px-8 py-8 border-b border-border flex items-center gap-5">
                    {/* Avatar Circle */}
                    <div className="h-14 w-14 rounded-full bg-success-bg text-success-text flex items-center justify-center text-xl font-bold border border-success-text/20">
                        {user?.first_name?.[0]}
                        {user?.last_name?.[0]}
                    </div>

                    <div>
                        {/* Notice the custom 'font-heading' (Fraunces) applied here */}
                        <h1 className="text-2xl font-bold text-main font-heading leading-tight">
                            {user?.first_name} {user?.last_name}
                        </h1>
                        <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-muted">
                            <ShieldCheck className="w-4 h-4 text-accent" />
                            <span>{user?.role}</span>
                        </div>
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-8 flex flex-col gap-6">
                    {/* Department Row */}
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-surface-hover border border-border">
                            <Building className="w-5 h-5 text-muted" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-main">Department Allocation</p>
                            <p className="text-sm text-muted font-mono mt-0.5">{user?.department_id}</p>
                        </div>
                    </div>

                    {/* UUID Row */}
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-surface-hover border border-border">
                            <Fingerprint className="w-5 h-5 text-muted" />
                        </div>
                        <div className="w-full overflow-hidden">
                            <p className="text-sm font-semibold text-main">System Identity (UUID)</p>
                            <div className="mt-2 w-full bg-surface-hover border border-border text-muted p-2.5 rounded-md font-mono text-xs truncate">{user?.id}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
