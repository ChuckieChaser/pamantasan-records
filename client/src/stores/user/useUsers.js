import { create } from 'zustand';
import { usersService } from '../../services';
import { action } from '../utilities';

export const useUsers = create((set, get) => ({
    // --- States ---
    users: [],
    activeUser: null,
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const users = await usersService.getAll();

        set({ users: users });
        return users;
    }),
    getById: action(set, async (id) => {
        const user = await usersService.getById(id);
        return user;
    }),
    getByUniversityId: action(set, async (universityId) => {
        const user = await usersService.getByUniversityId(universityId);
        return user;
    }),
    getByDepartmentId: action(set, async (departmentId) => {
        const users = await usersService.getByDepartmentId(departmentId);

        set({ users: users });
        return users;
    }),
    getByRole: action(set, async (role) => {
        const users = await usersService.getByRole(role);

        set({ users: users });
        return users;
    }),

    // --- Locals ---
    selectActiveUser: action(set, async (id) => {
        const user = get().users.find((u) => u.id === id);
        const activeUser = user ?? (await usersService.getById(id));

        set({ activeUser: activeUser });
        return activeUser;
    }),
    deselectActiveUser: () => {
        set({ activeUser: null });
    },

    // --- Actions ---
    create: action(set, async (data) => {
        const createdUser = await usersService.create(data);

        const users = get().users;
        const newUsers = [...users, createdUser];

        set({ users: newUsers });
        return createdUser;
    }),
    update: action(set, async (id, data) => {
        const updatedUser = await usersService.update(id, data);

        const users = get().users;
        const newUsers = users.map((u) => (u.id === id ? updatedUser : u));

        const activeUser = get().activeUser;
        const newActiveUser = activeUser?.id === id ? updatedUser : activeUser;

        set({
            users: newUsers,
            activeUser: newActiveUser,
        });

        return updatedUser;
    }),
}));
