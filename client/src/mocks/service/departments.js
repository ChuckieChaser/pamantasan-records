import { departmentsData } from '../data/departments';

const DELAY_MS = 500;

// --- Departments Service ---
export const mockDepartmentsService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const departments = [...departmentsData];
                resolve(departments);
            }, DELAY_MS);
        });
    },
    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const department = departmentsData.find((d) => d.id === id);
                department ? resolve({ ...department }) : reject(new Error('Department not found'));
            }, DELAY_MS);
        });
    },
    getByCode: async (code) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const department = departmentsData.find((d) => d.code === code);
                department ? resolve({ ...department }) : reject(new Error('Department not found'));
            }, DELAY_MS);
        });
    },
};
