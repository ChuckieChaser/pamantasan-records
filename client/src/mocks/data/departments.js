import { DepartmentsSchema } from '../../schemas';

// --- Global Constants ---
export const DEPARTMENT_CCS_ID = 'd0000000-0000-4000-8000-000000000001';
export const DEPARTMENT_HR_ID = 'd0000000-0000-4000-8000-000000000002';
export const DEPARTMENT_REG_ID = 'd0000000-0000-4000-8000-000000000003';
export const DEPARTMENT_FIN_ID = 'd0000000-0000-4000-8000-000000000004';
export const DEPARTMENT_SAO_ID = 'd0000000-0000-4000-8000-000000000005';

const NOW = new Date().toISOString();

// --- Raw Data ---
const rawDepartments = [
    {
        id: DEPARTMENT_CCS_ID,
        name: 'College of Computer Studies',
        code: 'CCS',
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DEPARTMENT_HR_ID,
        name: 'Human Resources',
        code: 'HR',
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DEPARTMENT_REG_ID,
        name: "Registrar's Office",
        code: 'REG',
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DEPARTMENT_FIN_ID,
        name: 'Finance Office',
        code: 'FIN',
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: DEPARTMENT_SAO_ID,
        name: 'Student Affairs Office',
        code: 'SAO',
        created_at: NOW,
        updated_at: NOW,
    },
];

// --- Strict Validation ---
export const departmentsData = rawDepartments.map((d) => DepartmentsSchema.parse(d));
