import { Router } from 'express';
import { pool, withRLS } from '../db.js';

const router = Router();

const getRLSContext = (req) => ({
    userId:       req.headers['x-user-id'],
    role:         req.headers['x-user-role'],
    departmentId: req.headers['x-user-dept'],
});

// GET /api/notifications — uses the vw_notifications view for grouped results
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { recipient_id, grouped } = req.query;

            if (grouped === 'true') {
                // Use the database view which groups notifications by entity+action
                const result = await c.query(
                    `SELECT * FROM vw_notifications WHERE recipient_id = $1 ORDER BY last_interaction_at DESC`,
                    [recipient_id]
                );
                return res.json(result.rows);
            }

            let query = 'SELECT * FROM notifications WHERE 1=1';
            const params = [];
            if (recipient_id) { params.push(recipient_id); query += ` AND recipient_id = $${params.length}`; }
            query += ' ORDER BY created_at DESC';
            const result = await c.query(query, params);
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/notifications/:id — Mark as read
router.patch('/:id', async (req, res) => {
    const { is_read } = req.body;
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'UPDATE notifications SET is_read = COALESCE($2, is_read) WHERE id = $1 RETURNING *',
                [req.params.id, is_read]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            await c.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
