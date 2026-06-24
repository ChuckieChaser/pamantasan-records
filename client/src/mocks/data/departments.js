import { DepartmentsSchema } from '../../schemas';

// --- Global Constants ---
export const DEPARTMENT_OUR_ID = 'd1111111-1111-1111-1111-111111111111';
export const DEPARTMENT_HRO_ID = 'd5555555-5555-5555-5555-555555555555';
export const DEPARTMENT_CCS_ID = 'd2222222-2222-2222-2222-222222222222';

// --- Raw Data ---
const rawDepartments = [
    {
        id: DEPARTMENT_OUR_ID,
        name: 'Office of the University Registrar',
        code: 'OUR',
        created_at: new Date(Date.now() - 31536000000).toISOString(),
        updated_at: new Date(Date.now() - 31536000000).toISOString(),
    },
    {
        id: DEPARTMENT_HRO_ID,
        name: 'Human Resources Office',
        code: 'HRO',
        created_at: new Date(Date.now() - 31536000000).toISOString(),
        updated_at: new Date(Date.now() - 2592000000).toISOString(),
    },
    {
        id: DEPARTMENT_CCS_ID,
        name: 'College of Computer Studies',
        code: 'CCS',
        created_at: new Date(Date.now() - 31536000000).toISOString(),
        updated_at: new Date(Date.now() - 15768000000).toISOString(),
    },
];

// --- Strict Validation ---
export const departmentsData = rawDepartments.map((department) => DepartmentsSchema.parse(department));
