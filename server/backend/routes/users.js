import { Router } from 'express';
import { pool, withRLS } from '../db.js';
import { logAudit } from '../services/audit.js';
import { createNotification } from '../services/notification.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const AVATARS_PATH = process.env.AVATARS_PATH || 'D:/records/avatars';
if (!fs.existsSync(AVATARS_PATH)) {
    fs.mkdirSync(AVATARS_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATARS_PATH),
    filename: (_req, _file, cb) => {
        const ext = path.extname(_file.originalname);
        cb(null, `${crypto.randomUUID()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

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
    const { university_id, department_id, role, email, first_name, middle_name, last_name, password } = req.body;
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

            if (password && password !== university_id) {
                const hash = await bcrypt.hash(password, 10);
                try {
                    await c.query(`SET LOCAL app.user_current_role = 'SYSTEM'`);
                    await c.query(`UPDATE user_credentials SET password_hash = $1 WHERE user_id = $2`, [hash, userRow.id]);
                } finally {
                    await c.query(`SET LOCAL app.user_current_role = '${userRole || 'GUEST'}'`);
                }
            }

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
        if (err.code === '23514') return res.status(400).json({ error: 'Invalid format for University ID or Email. Please use 00-00000 format and @pamantasan.edu.ph' });
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/users/:id
router.patch('/:id', upload.single('avatar'), async (req, res) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const isAdminOrSystem = userRole === 'ADMINISTRATOR' || userRole === 'SYSTEM';

    if (!isAdminOrSystem && req.params.id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    let allowed = [];
    if (isAdminOrSystem) {
        allowed = ['role', 'email', 'first_name', 'middle_name', 'last_name', 'status', 'avatar_path', 'department_id', 'university_id'];
    } else {
        // Self-update
        allowed = ['avatar_path', 'status', 'first_name', 'middle_name', 'last_name', 'email'];
    }

    const updates = Object.entries(req.body)
        .filter(([k]) => allowed.includes(k))
        .map(([k, v], i) => [`${k} = $${i + 2}`, v]);
        
    let paramOffset = updates.length + 2;

    if (req.file) {
        updates.push([`avatar_path = $${paramOffset}`, `/avatars/${req.file.filename}`]);
        paramOffset++;
        req.body.avatar_path = `/avatars/${req.file.filename}`;
    }

    if (updates.length === 0 && !req.body.password) return res.status(400).json({ error: 'No valid fields provided' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            let userRow = null;
            if (updates.length > 0) {
                try {
                    if (!isAdminOrSystem) await c.query(`RESET ROLE`);
                    const queryParams = [req.params.id, ...updates.map(u => {
                        const match = u[0].match(/(\w+) =/);
                        return match ? req.body[match[1]] : null;
                    })].filter(p => p !== undefined);
                    const result = await c.query(
                        `UPDATE users SET ${updates.map(u => u[0]).join(', ')} WHERE id = $1 RETURNING *`,
                        queryParams
                    );
                    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
                    userRow = result.rows[0];
                } finally {
                    if (!isAdminOrSystem) await c.query(`SET LOCAL ROLE app_user`);
                }
            } else {
                const result = await c.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
                if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
                userRow = result.rows[0];
            }

            // Get context variables which we may need for logging
            const auditUserId = getRLSContext(req).userId;
            const auditUserRole = getRLSContext(req).role;

            if (req.body.password) {
                const hash = await bcrypt.hash(req.body.password, 10);
                try {
                    if (!isAdminOrSystem) await c.query(`RESET ROLE`);
                    else await c.query(`SET LOCAL app.user_current_role = 'SYSTEM'`);
                    await c.query(`UPDATE user_credentials SET password_hash = $1 WHERE user_id = $2`, [hash, req.params.id]);
                } finally {
                    if (!isAdminOrSystem) await c.query(`SET LOCAL ROLE app_user`);
                    else await c.query(`SET LOCAL app.user_current_role = '${auditUserRole || 'GUEST'}'`);
                }
            }
            
            const actionVerb = 'status' in req.body && req.body.status === 'SUSPENDED' ? 'SUSPENDED' : 'UPDATED';

            await logAudit(c, {
                actor_id: auditUserId,
                entity_type: 'USER',
                entity_id: userRow.id,
                action: actionVerb,
                data: req.body
            });

            if (auditUserId !== userRow.id) {
                await createNotification(c, auditUserRole, {
                    recipient_id: userRow.id,
                    actor_id: auditUserId,
                    entity_type: 'USER',
                    entity_id: userRow.id,
                    action: actionVerb
                });
            }

            res.json(userRow);
        });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'University ID or email already exists' });
        if (err.code === '23514') return res.status(400).json({ error: 'Invalid format for University ID or Email. Please use 00-00000 format and @pamantasan.edu.ph' });
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
