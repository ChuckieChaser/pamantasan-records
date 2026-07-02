// File: src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';

const AuthenticationLayout = () => {
    return (
        // We use your custom Tailwind v4 theme colors (bg-background, text-main)
        // min-h-screen ensures it takes up the full height of the browser
        // flex, items-center, justify-center perfectly centers the login box
        <div className="flex min-h-screen w-full items-center justify-center bg-background text-main">
            {/* The <Outlet /> is a magical placeholder from React Router. */}
            {/* When the user visits '/login', the Login page component will be injected right here. */}
            <Outlet />
        </div>
    );
};

export default AuthenticationLayout;
