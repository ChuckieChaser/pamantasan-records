import { Router } from 'express';
import { pool, withRLS } from '../db.js';
import crypto from 'crypto';
import { logAudit } from '../services/audit.js';
import { createNotification } from '../services/notification.js';

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
            
            const reqRow = result.rows[0];
            const userRole = getRLSContext(req).role;

            await logAudit(c, {
                actor_id: requester_id,
                entity_type: 'COORDINATOR_REQUEST',
                entity_id: reqRow.id,
                action: 'CREATED',
                data: reqRow
            });

            // Notify all Administrators
            const admins = await c.query("SELECT id FROM users WHERE role = 'ADMINISTRATOR' AND status = 'VERIFIED'");
            for (const admin of admins.rows) {
                await createNotification(c, userRole, {
                    recipient_id: admin.id,
                    actor_id: requester_id,
                    entity_type: 'COORDINATOR_REQUEST',
                    entity_id: reqRow.id,
                    action: 'CREATED'
                });
            }

            res.status(201).json(reqRow);
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
        await client.query('BEGIN');
        
        let requestRecord = null;
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `UPDATE coordinator_requests
                 SET status           = COALESCE($2, status),
                     reviewer_id      = COALESCE($3, reviewer_id),
                     rejection_reason = COALESCE($4, rejection_reason)
                 WHERE id = $1 RETURNING *`,
                [req.params.id, status, reviewer_id, rejection_reason]
            );
            if (result.rows.length === 0) throw new Error('Request not found');
            requestRecord = result.rows[0];
        });

        // If approved, execute the action as SYSTEM
        if (requestRecord && status === 'APPROVED') {
            const data = requestRecord.data;
            await withRLS(client, { role: 'SYSTEM' }, async (sysClient) => {
                switch (requestRecord.action) {
                    case 'USER_CREATE': {
                        await sysClient.query(
                            `INSERT INTO users (id, first_name, middle_name, last_name, email, university_id, role, department_id)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            [data.id || crypto.randomUUID(), data.first_name, data.middle_name, data.last_name, data.email, data.university_id, data.role, data.department_id]
                        );
                        break;
                    }
                    case 'USER_UPDATE': {
                        const updates = [];
                        const params = [];
                        let i = 1;
                        if (data.role) { updates.push(`role = $${i++}`); params.push(data.role); }
                        if (data.email) { updates.push(`email = $${i++}`); params.push(data.email); }
                        if (data.first_name) { updates.push(`first_name = $${i++}`); params.push(data.first_name); }
                        if (data.middle_name) { updates.push(`middle_name = $${i++}`); params.push(data.middle_name); }
                        if (data.last_name) { updates.push(`last_name = $${i++}`); params.push(data.last_name); }
                        if (data.avatar_path) { updates.push(`avatar_path = $${i++}`); params.push(data.avatar_path); }

                        if (updates.length > 0) {
                            params.push(data.id);
                            await sysClient.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, params);
                        }
                        break;
                    }
                    case 'USER_SUSPEND': {
                        await sysClient.query(`UPDATE users SET status = $1 WHERE id = $2`, [data.status, data.id]);
                        break;
                    }
                    case 'DEPARTMENT_CREATE': {
                        await sysClient.query(
                            `INSERT INTO departments (id, name, type) VALUES ($1, $2, $3)`,
                            [data.id || crypto.randomUUID(), data.name, data.type]
                        );
                        break;
                    }
                    case 'DEPARTMENT_UPDATE': {
                        await sysClient.query(`UPDATE departments SET name = $1, type = $2 WHERE id = $3`, [data.name, data.type, data.id]);
                        break;
                    }
                    case 'DOCUMENT_SHARE': {
                        const docResult = await sysClient.query(`
                            WITH RECURSIVE DocumentTree AS (
                                SELECT id FROM documents WHERE id = $1
                                UNION ALL
                                SELECT d.id FROM documents d INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                            )
                            SELECT id FROM DocumentTree
                        `, [data.document_id]);
                        
                        for (const row of docResult.rows) {
                            await sysClient.query(
                                `INSERT INTO document_shares (document_id, sharer_id, recipient_id, department_id)
                                 VALUES ($1, $2, $3, $4)`,
                                [row.id, data.sharer_id, data.recipient_id || null, data.department_id || null]
                            );
                        }
                        break;
                    }
                    case 'DOCUMENT_DELETE': {
                        await sysClient.query(`DELETE FROM documents WHERE id = $1`, [data.id]);
                        break;
                    }
                    case 'DOCUMENT_UPDATE': {
                        await sysClient.query(`UPDATE documents SET name = $1, comment = COALESCE($2, comment) WHERE id = $3`, [data.name, data.comment, data.id]);
                        break;
                    }
                    case 'DOCUMENT_ARCHIVE': {
                        await sysClient.query(`UPDATE documents SET is_archived = $1 WHERE id = $2`, [data.is_archived, data.id]);
                        break;
                    }
                    case 'DOCUMENT_ATTACH': {
                        await sysClient.query(
                            `INSERT INTO document_request_attachments (document_request_id, document_id, attached_by_id) VALUES ($1, $2, $3)`,
                            [data.document_request_id, data.document_id, data.attached_by_id]
                        );
                        break;
                    }
                }
            });
        }
        
        const userId = getRLSContext(req).userId;
        const userRole = getRLSContext(req).role;

        // Note: we're outside withRLS here, so we'll just run these under a new withRLS block
        await withRLS(client, getRLSContext(req), async (c) => {
            if (['APPROVED', 'REJECTED'].includes(status)) {
                await logAudit(c, {
                    actor_id: userId,
                    entity_type: 'COORDINATOR_REQUEST',
                    entity_id: requestRecord.id,
                    action: status,
                    data: requestRecord
                });

                await createNotification(c, userRole, {
                    recipient_id: requestRecord.requester_id,
                    actor_id: userId,
                    entity_type: 'COORDINATOR_REQUEST',
                    entity_id: requestRecord.id,
                    action: status
                });
            }
        });

        await client.query('COMMIT');
        res.json(requestRecord);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.message === 'Request not found') return res.status(404).json({ error: err.message });
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
