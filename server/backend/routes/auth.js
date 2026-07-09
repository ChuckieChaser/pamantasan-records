import { Router } from 'express';
import { pool, withRLS } from '../db.js';
import { logger } from '../services/logger.js';
import bcrypt from 'bcrypt';

const router = Router();

// ==============================================================================
// AUTH ROUTES
// No JWT in this version — the server uses session-less simple auth.
// The client sends university_id + password and gets the user row back.
// The client stores the user in Zustand and attaches user context headers
// (X-User-Id, X-User-Role, X-User-Dept) on every subsequent request.
// The server reads those headers in the RLS middleware (middleware/rls.js).
// ==============================================================================

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { university_id, password } = req.body;

    if (!university_id || !password) {
        return res.status(400).json({ error: 'university_id and password are required' });
    }

    const client = await pool.connect();
    try {
        // System-level login query (bypasses RLS — uses SYSTEM role context)
        await withRLS(client, { role: 'SYSTEM' }, async (c) => {
            // 1. Find the user by university_id
            const userResult = await c.query(
                `SELECT u.*, uc.password_hash, us.theme, us.notification
                 FROM users u
                 LEFT JOIN user_credentials uc ON uc.user_id = u.id
                 LEFT JOIN user_settings    us ON us.user_id = u.id
                 WHERE u.university_id = $1`,
                [university_id]
            );

            if (userResult.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const row = userResult.rows[0];
            
            if (row.status === 'SUSPENDED') {
                return res.status(403).json({ error: 'Your account is suspended' });
            }

            let isValid = false;
            if (row.password_hash.startsWith('$2b$')) {
                isValid = await bcrypt.compare(password, row.password_hash).catch(() => false);
            } else {
                isValid = password === row.password_hash;
            }

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 3. Strip credential data before returning the user
            const { password_hash, ...user } = row;
            const settings = {
                theme:        row.theme,
                notification: row.notification
            };

            logger.info(`User logged in: ${user.email} (${user.role})`, 'AUTH');

            res.json({ user, settings });
        });
    } catch (err) {
        logger.error(`Login error: ${err.message}`, 'AUTH');
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET /api/auth/me — Fetch current user from context headers (used on page refresh)
router.get('/me', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const client = await pool.connect();
    try {
        await withRLS(client, {
            userId:       req.headers['x-user-id'],
            role:         req.headers['x-user-role'],
            departmentId: req.headers['x-user-dept'],
        }, async (c) => {
            const result = await c.query(
                `SELECT u.*, us.theme, us.notification
                 FROM users u
                 LEFT JOIN user_settings us ON us.user_id = u.id
                 WHERE u.id = $1`,
                [userId]
            );

            if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

            const { theme, notification, ...user } = result.rows[0];
            res.json({ user, settings: { theme, notification } });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
