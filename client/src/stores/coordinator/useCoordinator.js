import { create } from 'zustand';
import { coordinatorRequestsService } from '../../services';
import { action } from '../utilities';

export const useCoordinatorRequest = create((set, get) => ({
    // --- States ---
    coordinatorRequests: [],
    activeCoordinatorRequest: null,
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const coordinatorRequests = await coordinatorRequestsService.getAll();

        set({ coordinatorRequests: coordinatorRequests });
        return coordinatorRequests;
    }),
    getById: action(set, async (id) => {
        const coordinatorRequest = await coordinatorRequestsService.getById(id);
        return coordinatorRequest;
    }),
    getByRequesterId: action(set, async (requesterId) => {
        const coordinatorRequests = await coordinatorRequestsService.getByRequesterId(requesterId);

        set({ coordinatorRequests: coordinatorRequests });
        return coordinatorRequests;
    }),
    getByReviewerId: action(set, async (reviewerId) => {
        const coordinatorRequests = await coordinatorRequestsService.getByReviewerId(reviewerId);

        set({ coordinatorRequests: coordinatorRequests });
        return coordinatorRequests;
    }),
    getByStatus: action(set, async (status) => {
        const coordinatorRequests = await coordinatorRequestsService.getByStatus(status);

        set({ coordinatorRequests: coordinatorRequests });
        return coordinatorRequests;
    }),

    // --- Locals ---
    selectActiveCoordinatorRequest: action(set, async (id) => {
        const coordinatorRequest = get().coordinatorRequests.find((cr) => cr.id === id);
        const activeCoordinatorRequest = coordinatorRequest ?? (await coordinatorRequestsService.getById(id));

        set({ activeCoordinatorRequest: activeCoordinatorRequest });
        return activeCoordinatorRequest;
    }),
    deselectActiveCoordinatorRequest: () => {
        set({ activeCoordinatorRequest: null });
    },

    // --- Actions ---
    create: action(set, async (data) => {
        const createdCoordinatorRequest = await coordinatorRequestsService.create(data);

        const coordinatorRequests = get().coordinatorRequests;
        const newCoordinatorRequests = [...coordinatorRequests, createdCoordinatorRequest];

        set({ coordinatorRequests: newCoordinatorRequests });
        return createdCoordinatorRequest;
    }),
    update: action(set, async (id, data) => {
        const updatedCoordinatorRequest = await coordinatorRequestsService.update(id, data);

        const coordinatorRequests = get().coordinatorRequests;
        const newCoordinatorRequests = coordinatorRequests.map((cr) => (cr.id === id ? updatedCoordinatorRequest : cr));

        const activeCoordinatorRequest = get().activeCoordinatorRequest;
        const newActiveCoordinatorRequest = activeCoordinatorRequest?.id === id ? updatedCoordinatorRequest : activeCoordinatorRequest;

        set({
            coordinatorRequests: newCoordinatorRequests,
            activeCoordinatorRequest: newActiveCoordinatorRequest,
        });

        return updatedCoordinatorRequest;
    }),
    delete: action(set, async (id) => {
        await coordinatorRequestsService.delete(id);

        const coordinatorRequests = get().coordinatorRequests;
        const newCoordinatorRequests = coordinatorRequests.filter((cr) => cr.id !== id);

        const activeCoordinatorRequest = get().activeCoordinatorRequest;
        const newActiveCoordinatorRequest = activeCoordinatorRequest?.id === id ? null : activeCoordinatorRequest;

        set({
            coordinatorRequests: newCoordinatorRequests,
            activeCoordinatorRequest: newActiveCoordinatorRequest,
        });

        return id;
    }),
}));
