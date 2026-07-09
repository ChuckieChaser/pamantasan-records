import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

// ==============================================================================
// DATABASE POOL
// Single shared pool instance for the entire application.
// All route files import this — never create their own pool.
// ==============================================================================

export const pool = new Pool({
    user: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'pamantasan_records',
});

// ==============================================================================
// RLS CONTEXT SETTER
// Wraps a callback in a transaction that sets the Postgres session variables
// required to activate Row Level Security. The calling route must supply the
// authenticated user context. Use 'SYSTEM' role for server-to-server queries.
// ==============================================================================

export async function withRLS(client, context, callback) {
    try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL ROLE app_user`);
        const cleanUserId = context.userId === 'null' || context.userId === 'undefined' ? '' : context.userId || '';
        const cleanRole = context.role === 'null' || context.role === 'undefined' ? 'SYSTEM' : context.role || 'SYSTEM';
        const cleanDeptId = context.departmentId === 'null' || context.departmentId === 'undefined' ? '' : context.departmentId || '';

        await client.query(`SET LOCAL app.user_current_id          = '${cleanUserId}'`);
        await client.query(`SET LOCAL app.user_current_role        = '${cleanRole}'`);
        await client.query(`SET LOCAL app.user_current_department_id = '${cleanDeptId}'`);

        const result = await callback(client);

        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
}
