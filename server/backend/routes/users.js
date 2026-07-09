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

// GET /api/users
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { department_id, role } = req.query;
            let query = 'SELECT * FROM users WHERE 1=1';
            const params = [];
            if (department_id) { params.push(department_id); query += ` AND department_id = $${params.length}`; }
            if (role)          { params.push(role);          query += ` AND role = $${params.length}`; }
            query += ' ORDER BY last_name, first_name ASC';

            const result = await c.query(query, params);
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    const { university_id, department_id, role, email, first_name, middle_name, last_name } = req.body;
    if (!university_id || !department_id || !role || !email || !first_name || !last_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `INSERT INTO users (university_id, department_id, role, email, first_name, middle_name, last_name)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [university_id, department_id, role, email, first_name, middle_name || null, last_name]
            );

            // Note: user_settings and user_credentials are automatically created by the trigger_initialize_user_data trigger on the database level.

            const userRow = result.rows[0];
            const userId = getRLSContext(req).userId;
            const userRole = getRLSContext(req).role;

            await logAudit(c, {
                actor_id: userId,
                entity_type: 'USER',
                entity_id: userRow.id,
                action: 'CREATED',
                data: userRow
            });

            await createNotification(c, userRole, {
                recipient_id: userRow.id,
                actor_id: userId,
                entity_type: 'USER',
                entity_id: userRow.id,
                action: 'CREATED'
            });

            res.status(201).json(userRow);
        });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'University ID or email already exists' });
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res) => {
    const allowed = ['role', 'email', 'first_name', 'middle_name', 'last_name', 'status', 'avatar_path'];
    const updates = Object.entries(req.body)
        .filter(([k]) => allowed.includes(k))
        .map(([k, v], i) => [`${k} = $${i + 2}`, v]);

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `UPDATE users SET ${updates.map(u => u[0]).join(', ')} WHERE id = $1 RETURNING *`,
                [req.params.id, ...updates.map(u => u[1])]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
            const userRow = result.rows[0];
            const userId = getRLSContext(req).userId;
            const userRole = getRLSContext(req).role;
            const actionVerb = 'status' in req.body && req.body.status === 'SUSPENDED' ? 'SUSPENDED' : 'UPDATED';

            await logAudit(c, {
                actor_id: userId,
                entity_type: 'USER',
                entity_id: userRow.id,
                action: actionVerb,
                data: req.body
            });

            if (userId !== userRow.id) {
                await createNotification(c, userRole, {
                    recipient_id: userRow.id,
                    actor_id: userId,
                    entity_type: 'USER',
                    entity_id: userRow.id,
                    action: actionVerb
                });
            }

            res.json(userRow);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/users/:id/settings
router.get('/:id/settings', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM user_settings WHERE user_id = $1', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Settings not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/users/:id/settings
router.patch('/:id/settings', async (req, res) => {
    const { theme, notification } = req.body;
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `UPDATE user_settings
                 SET theme        = COALESCE($2, theme),
                     notification = COALESCE($3, notification)
                 WHERE user_id = $1 RETURNING *`,
                [req.params.id, theme, notification]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Settings not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
