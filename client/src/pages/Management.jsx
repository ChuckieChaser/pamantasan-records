import { useEffect } from 'react';
import { 
    useAuthentication, 
    useDepartment, 
    useUser, 
    useCoordinatorRequest, 
    useDocumentRequest 
} from '../stores';
import DepartmentBrowser from '../components/management/DepartmentBrowser';
import UserBrowser from '../components/management/UserBrowser';
import CoordinatorRequestBrowser from '../components/management/CoordinatorRequestBrowser';
import DocumentRequestBrowser from '../components/management/DocumentRequestBrowser';
import { USERS_ROLE } from '../constants';

// ==============================================================================
// SECTION 1: PAGE
// ==============================================================================

export default function Management() {
    const user = useAuthentication((state) => state.user);

    const { getAll: getDepartments, departments, activeDepartment, selectActiveDepartment, deselectActiveDepartment } = useDepartment();
    const { getAll: getUsers, users, activeUser, selectActiveUser, deselectActiveUser } = useUser();
    const { getAll: getCoordinatorRequests, coordinatorRequests, activeCoordinatorRequest, selectActiveCoordinatorRequest, deselectActiveCoordinatorRequest } = useCoordinatorRequest();
    const { getAll: getDocumentRequests, documentRequests, activeDocumentRequest, selectActiveDocumentRequest, deselectActiveDocumentRequest } = useDocumentRequest();

    // --- Initialization ---
    useEffect(() => {
        getDepartments();
        getUsers();
        getCoordinatorRequests();
        getDocumentRequests();

        return () => {
            deselectActiveDepartment();
            deselectActiveUser();
            deselectActiveCoordinatorRequest();
            deselectActiveDocumentRequest();
        };
    }, [getDepartments, getUsers, getCoordinatorRequests, getDocumentRequests, deselectActiveDepartment, deselectActiveUser, deselectActiveCoordinatorRequest, deselectActiveDocumentRequest]);

    // --- Handlers ---
    const handleDepartmentClick = (id) => {
        if (activeDepartment?.id === id) {
            deselectActiveDepartment();
        } else {
            deselectActiveUser();
            deselectActiveCoordinatorRequest();
            deselectActiveDocumentRequest();
            selectActiveDepartment(id);
        }
    };

    const handleUserClick = (id) => {
        if (activeUser?.id === id) {
            deselectActiveUser();
        } else {
            deselectActiveDepartment();
            deselectActiveCoordinatorRequest();
            deselectActiveDocumentRequest();
            selectActiveUser(id);
        }
    };

    const handleCoordinatorRequestClick = (id) => {
        if (activeCoordinatorRequest?.id === id) {
            deselectActiveCoordinatorRequest();
        } else {
            deselectActiveDepartment();
            deselectActiveUser();
            deselectActiveDocumentRequest();
            selectActiveCoordinatorRequest(id);
        }
    };

    const handleDocumentRequestClick = (id) => {
        if (activeDocumentRequest?.id === id) {
            deselectActiveDocumentRequest();
        } else {
            deselectActiveDepartment();
            deselectActiveUser();
            deselectActiveCoordinatorRequest();
            selectActiveDocumentRequest(id);
        }
    };

    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold text-main">Management</h1>
                <p className="mt-1 text-sm text-muted">Review coordinator requests and manage system operations.</p>
            </div>

            {/* --- Manage Departments --- */}
            {user?.role === USERS_ROLE.ADMINISTRATOR && (
                <DepartmentBrowser 
                    title="Manage Departments"
                    description="Add and update system departments."
                    departments={departments}
                    activeDepartmentId={activeDepartment?.id}
                    onDepartmentClick={handleDepartmentClick}
                />
            )}

            {/* --- Manage Users --- */}
            {user?.role === USERS_ROLE.ADMINISTRATOR && (
                <UserBrowser 
                    title="Manage Users"
                    description="Add, update, and suspend user accounts."
                    users={users}
                    departments={departments}
                    activeUserId={activeUser?.id}
                    onUserClick={handleUserClick}
                />
            )}

            {/* --- Manage Coordinator Requests --- */}
            {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                <CoordinatorRequestBrowser 
                    title="Manage Coordinator Requests"
                    description="Approve and deny coordinator operations."
                    requests={coordinatorRequests}
                    users={users}
                    activeRequestId={activeCoordinatorRequest?.id}
                    onRequestClick={handleCoordinatorRequestClick}
                />
            )}

            {/* --- Manage Document Requests --- */}
            {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                <DocumentRequestBrowser 
                    title="Manage Document Requests"
                    description="View and resolve all document requests done by users."
                    requests={documentRequests}
                    users={users}
                    activeRequestId={activeDocumentRequest?.id}
                    onRequestClick={handleDocumentRequestClick}
                />
            )}
        </div>
    );
}
