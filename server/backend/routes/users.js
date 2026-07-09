import { Router } from 'express';
import { pool, withRLS } from '../db.js';

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

            // Also create default user_settings row
            await c.query(
                'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
                [result.rows[0].id]
            );

            res.status(201).json(result.rows[0]);
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
            res.json(result.rows[0]);
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
