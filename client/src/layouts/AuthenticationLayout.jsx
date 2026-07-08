import { Outlet } from 'react-router-dom';

// ==============================================================================
// SECTION 1: LAYOUT
// ==============================================================================

export default function AuthenticationLayout() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 text-main">
            <Outlet />
        </div>
    );
}
