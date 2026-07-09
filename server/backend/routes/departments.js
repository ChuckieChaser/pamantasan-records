import { Router } from 'express';
import { pool, withRLS } from '../db.js';
import { logAudit } from '../services/audit.js';
import { createNotification } from '../services/notification.js';

const router = Router();

const getRLSContext = (req) => ({
    userId:       req.headers['x-user-id'],
    role:         req.headers['x-user-role'],
    departmentId: req.headers['x-user-dept'],
});

// GET /api/departments
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM departments ORDER BY name ASC');
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/departments/:id
router.get('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM departments WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/departments
router.post('/', async (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *',
                [name, code]
            );
            
            const deptRow = result.rows[0];
            const userId = getRLSContext(req).userId;
            const userRole = getRLSContext(req).role;

            await logAudit(c, {
                actor_id: userId,
                entity_type: 'DEPARTMENT',
                entity_id: deptRow.id,
                action: 'CREATED',
                data: deptRow
            });

            const admins = await c.query("SELECT id FROM users WHERE role = 'ADMINISTRATOR' AND status = 'VERIFIED'");
            for (const admin of admins.rows) {
                await createNotification(c, userRole, {
                    recipient_id: admin.id,
                    actor_id: userId,
                    entity_type: 'DEPARTMENT',
                    entity_id: deptRow.id,
                    action: 'CREATED'
                });
            }

            res.status(201).json(deptRow);
        });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Department name or code already exists' });
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/departments/:id
router.patch('/:id', async (req, res) => {
    const { name, code } = req.body;
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'UPDATE departments SET name = COALESCE($1, name), code = COALESCE($2, code) WHERE id = $3 RETURNING *',
                [name, code, req.params.id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
            
            const deptRow = result.rows[0];
            const userId = getRLSContext(req).userId;
            const userRole = getRLSContext(req).role;

            await logAudit(c, {
                actor_id: userId,
                entity_type: 'DEPARTMENT',
                entity_id: deptRow.id,
                action: 'UPDATED',
                data: deptRow
            });

            const admins = await c.query("SELECT id FROM users WHERE role = 'ADMINISTRATOR' AND status = 'VERIFIED'");
            for (const admin of admins.rows) {
                await createNotification(c, userRole, {
                    recipient_id: admin.id,
                    actor_id: userId,
                    entity_type: 'DEPARTMENT',
                    entity_id: deptRow.id,
                    action: 'UPDATED'
                });
            }

            res.json(deptRow);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/departments/:id
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            await c.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
