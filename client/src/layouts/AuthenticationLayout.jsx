import { Outlet } from 'react-router-dom';

const AuthenticationLayout = () => {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background text-main p-4">
            <Outlet />
        </div>
    );
};

export default AuthenticationLayout;
