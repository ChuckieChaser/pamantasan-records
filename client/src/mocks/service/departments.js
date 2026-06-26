import { departmentsData } from '../data';

const DELAY_MS = 500;

export const mockDepartmentsService = {
    // --- Reads ---
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

    // --- Actions ---
    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const department = {
                    id: crypto.randomUUID(),
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                departmentsData.push(department);
                resolve(department);
            }, DELAY_MS);
        });
    },
    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = departmentsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Department not found'));

                departmentsData[index] = {
                    ...departmentsData[index],
                    ...data,
                    updated_at: new Date().toISOString(),
                };

                resolve(departmentsData[index]);
            }, DELAY_MS);
        });
    },
    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = departmentsData.findIndex((i) => i.id === id);
                if (index === -1) return reject(new Error('Department not found'));

                departmentsData.splice(index, 1);
                resolve({ success: true });
            }, DELAY_MS);
        });
    },
};
