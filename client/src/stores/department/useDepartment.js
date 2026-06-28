import { create } from 'zustand';
import { departmentsService } from '../../services';
import { action } from '../utilities';

export const useDepartment = create((set, get) => ({
    // --- States ---
    departments: [],
    activeDepartment: null,
    isLoading: false,
    error: null,

    // --- Reads ---
    getAll: action(set, async () => {
        const departments = await departmentsService.getAll();

        set({ departments: departments });
        return departments;
    }),
    getById: action(set, async (id) => {
        const department = await departmentsService.getById(id);
        return department;
    }),
    getByCode: action(set, async (code) => {
        const department = await departmentsService.getByCode(code);
        return department;
    }),

    // --- Locals ---
    selectActiveDepartment: action(set, async (id) => {
        const department = get().departments.find((d) => d.id === id);
        const activeDepartment = department ?? (await departmentsService.getById(id));

        set({ activeDepartment: activeDepartment });
        return activeDepartment;
    }),
    deselectActiveDepartment: () => {
        set({ activeDepartment: null });
    },

    // --- Actions ---
    create: action(set, async (data) => {
        const createdDepartment = await departmentsService.create(data);

        const departments = get().departments;
        const newDepartments = [...departments, createdDepartment];

        set({ departments: newDepartments });
        return createdDepartment;
    }),
    update: action(set, async (id, data) => {
        const updatedDepartment = await departmentsService.update(id, data);

        const departments = get().departments;
        const newDepartments = departments.map((nd) => (nd.id === id ? updatedDepartment : nd));

        const activeDepartment = get().activeDepartment;
        const newActiveDepartment = activeDepartment?.id === id ? updatedDepartment : activeDepartment;

        set({
            departments: newDepartments,
            activeDepartment: newActiveDepartment,
        });

        return updatedDepartment;
    }),
    delete: action(set, async (id) => {
        await departmentsService.delete(id);

        const departments = get().departments;
        const newDepartments = departments.filter((nd) => nd.id !== id);

        const activeDepartment = get().activeDepartment;
        const newActiveDepartment = activeDepartment?.id === id ? null : activeDepartment;

        set({
            departments: newDepartments,
            activeDepartment: newActiveDepartment,
        });

        return id;
    }),
}));
