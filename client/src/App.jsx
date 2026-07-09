import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAuthentication } from './stores';

import AuthenticationLayout from './layouts/AuthenticationLayout';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Archives from './pages/Archives';
import Management from './pages/Management';
import Requests from './pages/Requests';
import Onboarding from './pages/Onboarding';

// ==============================================================================
// SECTION 1: GUARDS
// ==============================================================================

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthentication((state) => state.isAuthenticated);
    const user = useAuthentication((state) => state.user);

    if (!isAuthenticated) return <Navigate to="/" replace />;
    if (user && user.status !== 'VERIFIED') return <Navigate to="/onboarding" replace />;

    return children;
};

// ==============================================================================
// SECTION 2: ROUTER
// ==============================================================================

export default function App() {
    const isAuthenticated = useAuthentication((state) => state.isAuthenticated);

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AuthenticationLayout />}>
                    <Route path="/" element={<Login />} />
                    <Route 
                        path="/onboarding" 
                        element={
                            isAuthenticated ? (
                                <Onboarding />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        } 
                    />
                </Route>

                <Route
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/management" element={<Management />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/documents/:folderId" element={<Documents />} />
                    <Route path="/archives" element={<Archives />} />
                    <Route path="/requests" element={<Requests />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
