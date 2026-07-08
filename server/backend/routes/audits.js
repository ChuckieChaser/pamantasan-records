import { Router } from 'express';
import { pool, withRLS } from '../db.js';

const router = Router();

const getRLSContext = (req) => ({
    userId:       req.headers['x-user-id'],
    role:         req.headers['x-user-role'],
    departmentId: req.headers['x-user-dept'],
});

// GET /api/audits
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { actor_id, entity_type, entity_id, limit } = req.query;
            let query = 'SELECT * FROM audit_logs WHERE 1=1';
            const params = [];
            if (actor_id)    { params.push(actor_id);    query += ` AND actor_id = $${params.length}`; }
            if (entity_type) { params.push(entity_type); query += ` AND entity_type = $${params.length}`; }
            if (entity_id)   { params.push(entity_id);   query += ` AND entity_id = $${params.length}`; }
            query += ' ORDER BY created_at DESC';
            if (limit) {
                params.push(parseInt(limit));
                query += ` LIMIT $${params.length}`;
            }
            const result = await c.query(query, params);
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/audits/:id
router.get('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM audit_logs WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Audit log not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/audits — Explicit audit log creation from client
router.post('/', async (req, res) => {
    const { actor_id, entity_type, entity_id, action, data } = req.body;
    if (!entity_type || !entity_id || !action || !data) {
        return res.status(400).json({ error: 'entity_type, entity_id, action, and data are required' });
    }

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [actor_id || null, entity_type, entity_id, action, JSON.stringify(data)]
            );
            res.status(201).json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
