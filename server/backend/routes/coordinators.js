import { Router } from 'express';
import { pool, withRLS } from '../db.js';

const router = Router();

const getRLSContext = (req) => ({
    userId:       req.headers['x-user-id'],
    role:         req.headers['x-user-role'],
    departmentId: req.headers['x-user-dept'],
});

// GET /api/coordinators
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { requester_id, status, action } = req.query;
            let query = 'SELECT * FROM coordinator_requests WHERE 1=1';
            const params = [];
            if (requester_id) { params.push(requester_id); query += ` AND requester_id = $${params.length}`; }
            if (status)       { params.push(status);        query += ` AND status = $${params.length}`; }
            if (action)       { params.push(action);        query += ` AND action = $${params.length}`; }
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

// GET /api/coordinators/:id
router.get('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM coordinator_requests WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/coordinators
router.post('/', async (req, res) => {
    const { requester_id, action, data } = req.body;
    if (!requester_id || !action || !data) return res.status(400).json({ error: 'requester_id, action, and data are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'INSERT INTO coordinator_requests (requester_id, action, data) VALUES ($1, $2, $3) RETURNING *',
                [requester_id, action, JSON.stringify(data)]
            );
            res.status(201).json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/coordinators/:id
router.patch('/:id', async (req, res) => {
    const { status, reviewer_id, rejection_reason } = req.body;
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `UPDATE coordinator_requests
                 SET status           = COALESCE($2, status),
                     reviewer_id      = COALESCE($3, reviewer_id),
                     rejection_reason = COALESCE($4, rejection_reason)
                 WHERE id = $1 RETURNING *`,
                [req.params.id, status, reviewer_id, rejection_reason]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/coordinators/:id
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            await c.query('DELETE FROM coordinator_requests WHERE id = $1', [req.params.id]);
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
