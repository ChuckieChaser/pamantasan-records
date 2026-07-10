import { Router } from 'express';
import { pool, withRLS } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { logAudit } from '../services/audit.js';
import { createNotification } from '../services/notification.js';
import { textExtractor } from '../services/textExtractor.js';
import { ollamaService } from '../services/ollama.js';
import { logger } from '../services/logger.js';
import { createRequire } from 'module'

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const router = Router();

// ==============================================================================
// FILE STORAGE (Multer)
// Files are stored under DOCUMENTS_PATH, obfuscated via a random UUID filename.
// The original name and uuid are tracked in document_versions.path column.
// ==============================================================================

const DOCUMENTS_PATH = process.env.DOCUMENTS_PATH || 'D:/records/documents';

// Ensure the documents directory exists on startup
if (!fs.existsSync(DOCUMENTS_PATH)) {
    fs.mkdirSync(DOCUMENTS_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DOCUMENTS_PATH),
    filename: (_req, _file, cb) => {
        // Obfuscate via UUID — the file extension is preserved for MIME compatibility
        const ext = path.extname(_file.originalname);
        cb(null, `${crypto.randomUUID()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const getRLSContext = (req) => ({
    userId: req.headers['x-user-id'] || req.query.userId || '00000000-0000-0000-0000-000000000000',
    role: req.headers['x-user-role'] || req.query.role || 'ANONYMOUS',
    departmentId: req.headers['x-user-dept'] || req.query.deptId || '00000000-0000-0000-0000-000000000000',
});

// ==============================================================================
// DOCUMENTS ROUTES
// ==============================================================================

// GET /api/documents
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { parent_id, is_archived, is_folder } = req.query;
            let query = 'SELECT * FROM documents WHERE 1=1';
            const params = [];

            if (parent_id !== undefined) {
                params.push(parent_id === 'null' ? null : parent_id);
                query += ` AND parent_id ${parent_id === 'null' ? 'IS NULL' : `= $${params.length}`}`;
            }
            if (is_archived !== undefined) { params.push(is_archived === 'true'); query += ` AND is_archived = $${params.length}`; }
            if (is_folder) { params.push(is_folder === 'true'); query += ` AND is_folder = $${params.length}`; }

            query += ' ORDER BY is_folder DESC, name ASC';

            const result = await c.query(query, params);
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/documents/shares — Share a document (and cascade to children)
// NOTE: document_request_id does NOT exist on document_shares table. Use document_request_attachments instead.
router.post('/shares', async (req, res) => {
    const { document_id, sharer_id, recipient_id, department_id } = req.body;
    if (!document_id || !sharer_id) return res.status(400).json({ error: 'document_id and sharer_id are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            // Find all descendants of the document (cascade share to folder children)
            const findQuery = `
                WITH RECURSIVE DocumentTree AS (
                    SELECT id FROM documents WHERE id = $1
                    UNION ALL
                    SELECT d.id FROM documents d
                    INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                )
                SELECT id FROM DocumentTree;
            `;
            const docResult = await c.query(findQuery, [document_id]);

            const results = [];
            for (const docRow of docResult.rows) {
                const result = await c.query(
                    `INSERT INTO document_shares (document_id, sharer_id, recipient_id, department_id)
                     VALUES ($1, $2, $3, $4) RETURNING *`,
                    [docRow.id, sharer_id, recipient_id || null, department_id || null]
                );
                if (docRow.id === document_id) {
                    results.push(result.rows[0]); // Return the main document's share record

                    // 1. Audit Log
                    await logAudit(c, {
                        actor_id: sharer_id,
                        entity_type: 'DOCUMENT',
                        entity_id: document_id,
                        action: 'SHARED',
                        data: { recipient_id, department_id }
                    });

                    // 2. Notification(s)
                    const userRole = req.headers['x-user-role'];
                    if (recipient_id) {
                        await createNotification(c, userRole, {
                            recipient_id: recipient_id,
                            actor_id: sharer_id,
                            entity_type: 'DOCUMENT',
                            entity_id: document_id,
                            action: 'SHARED'
                        });
                    } else if (department_id) {
                        const deptUsers = await c.query('SELECT id FROM users WHERE department_id = $1', [department_id]);
                        for (const u of deptUsers.rows) {
                            if (u.id !== sharer_id) {
                                await createNotification(c, userRole, {
                                    recipient_id: u.id,
                                    actor_id: sharer_id,
                                    entity_type: 'DOCUMENT',
                                    entity_id: document_id,
                                    action: 'SHARED'
                                });
                            }
                        }
                    }
                }
            }

            res.status(201).json(results[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/documents/shares/:id — Update a document share status
router.patch('/shares/:id', async (req, res) => {
    const { status, recipient_id } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const shareRes = await c.query('SELECT document_id, department_id, recipient_id, sharer_id, id FROM document_shares WHERE id = $1', [req.params.id]);
            if (shareRes.rows.length === 0) return res.status(404).json({ error: 'Share not found' });

            const share = shareRes.rows[0];
            const userId = getRLSContext(req).userId;
            const userRole = getRLSContext(req).role;

            const updateParts = ['status = $1'];
            const params = [status];
            if (recipient_id !== undefined) {
                updateParts.push(`recipient_id = $${params.length + 1}`);
                params.push(recipient_id);
            }

            // Execute recursive CTE update
            const result = await c.query(`
                WITH RECURSIVE DocumentTree AS (
                    SELECT id FROM documents WHERE id = $${params.length + 1}
                    UNION ALL
                    SELECT d.id FROM documents d INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                )
                UPDATE document_shares 
                SET ${updateParts.join(', ')}
                WHERE document_id IN (SELECT id FROM DocumentTree)
                AND (department_id = $${params.length + 2} OR (department_id IS NULL AND $${params.length + 2} IS NULL))
                AND (recipient_id = $${params.length + 3} OR (recipient_id IS NULL AND $${params.length + 3} IS NULL))
                RETURNING *
            `, [...params, share.document_id, share.department_id, share.recipient_id]);

            // 1. Cross-update document_versions for Approvals/Publishing
            // Use a nested try-catch so that a failure here does NOT abort the outer transaction.
            if (['APPROVED', 'PUBLISHED', 'PENDING_APPROVAL'].includes(status)) {
                try {
                    if (['APPROVED', 'PUBLISHED'].includes(status)) {
                        const updateField = status === 'APPROVED' ? 'approver_id' : 'publisher_id';
                        await c.query(
                            `UPDATE document_versions
                             SET ${updateField} = $1
                             WHERE document_id = $2
                             AND version = (SELECT MAX(version) FROM document_versions WHERE document_id = $2)`,
                            [userId, share.document_id]
                        );
                    } else if (status === 'PENDING_APPROVAL') {
                        // Unapproving — clear the approver
                        await c.query(
                            `UPDATE document_versions
                             SET approver_id = NULL
                             WHERE document_id = $1
                             AND version = (SELECT MAX(version) FROM document_versions WHERE document_id = $1)`,
                            [share.document_id]
                        );
                    }
                } catch (versionErr) {
                    // Non-fatal: log but don't abort the share status update
                    console.warn('Could not cross-update document_versions:', versionErr.message);
                }
            }

            // 2. Audit Log
            await logAudit(c, {
                actor_id: userId,
                entity_type: 'DOCUMENT',
                entity_id: share.document_id,
                action: status,
                data: { share_id: share.id, status }
            });

            // 3. Notification to the Sharer (who uploaded/shared it)
            await createNotification(c, userRole, {
                recipient_id: share.sharer_id,
                actor_id: userId,
                entity_type: 'DOCUMENT',
                entity_id: share.document_id,
                action: status
            });

            // Find the returning row for the parent
            const returnedParentShare = result.rows.find(r => r.id === share.id) || share;
            res.json(returnedParentShare);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/documents/shares/:id
router.delete('/shares/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            // First get the target share to know what we are deleting
            const shareRes = await c.query('SELECT document_id, department_id, recipient_id FROM document_shares WHERE id = $1', [req.params.id]);
            if (shareRes.rows.length === 0) return res.status(404).json({ error: 'Share not found' });

            const share = shareRes.rows[0];

            // Use a recursive CTE to find the document and all its descendants
            await c.query(`
                WITH RECURSIVE DocumentTree AS (
                    SELECT id FROM documents WHERE id = $1
                    UNION ALL
                    SELECT d.id FROM documents d INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                )
                DELETE FROM document_shares 
                WHERE document_id IN (SELECT id FROM DocumentTree)
                AND (department_id = $2 OR (department_id IS NULL AND $2 IS NULL))
                AND (recipient_id = $3 OR (recipient_id IS NULL AND $3 IS NULL))
            `, [share.document_id, share.department_id, share.recipient_id]);

            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ==============================================================================
// DOCUMENT REQUESTS ROUTES
// ==============================================================================

// GET /api/documents/requests
router.get('/requests', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { requester_id, status } = req.query;
            let query = 'SELECT * FROM document_requests WHERE 1=1';
            const params = [];
            if (requester_id) { params.push(requester_id); query += ` AND requester_id = $${params.length}`; }
            if (status) { params.push(status); query += ` AND status = $${params.length}`; }
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

// POST /api/documents/requests
router.post('/requests', async (req, res) => {
    const { requester_id, subject } = req.body;
    if (!requester_id || !subject) return res.status(400).json({ error: 'requester_id and subject are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'INSERT INTO document_requests (requester_id, subject) VALUES ($1, $2) RETURNING *',
                [requester_id, subject]
            );

            const reqRow = result.rows[0];
            const userRole = getRLSContext(req).role;

            await logAudit(c, {
                actor_id: requester_id,
                entity_type: 'DOCUMENT_REQUEST',
                entity_id: reqRow.id,
                action: 'CREATED',
                data: reqRow
            });

            await createNotification(c, userRole, {
                recipient_id: requester_id,
                actor_id: requester_id,
                entity_type: 'DOCUMENT_REQUEST',
                entity_id: reqRow.id,
                action: 'CREATED'
            });

            res.status(201).json(reqRow);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/documents/requests/:id
router.patch('/requests/:id', async (req, res) => {
    const { status, resolver_id } = req.body;
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `UPDATE document_requests
                 SET status = COALESCE($2, status), resolver_id = COALESCE($3, resolver_id)
                 WHERE id = $1 RETURNING *`,
                [req.params.id, status, resolver_id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

            const reqRow = result.rows[0];
            const userId = getRLSContext(req).userId;
            const userRole = getRLSContext(req).role;

            if (status === 'RESOLVED') {
                await logAudit(c, {
                    actor_id: userId,
                    entity_type: 'DOCUMENT_REQUEST',
                    entity_id: reqRow.id,
                    action: 'RESOLVED',
                    data: reqRow
                });

                await createNotification(c, userRole, {
                    recipient_id: reqRow.requester_id,
                    actor_id: userId,
                    entity_type: 'DOCUMENT_REQUEST',
                    entity_id: reqRow.id,
                    action: 'RESOLVED'
                });
            }

            res.json(reqRow);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/documents/requests/:id/messages
router.get('/requests/:id/messages', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'SELECT * FROM document_request_messages WHERE document_request_id = $1 ORDER BY created_at ASC',
                [req.params.id]
            );
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/documents/requests/:id/messages
router.post('/requests/:id/messages', async (req, res) => {
    const { user_id, message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'INSERT INTO document_request_messages (document_request_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
                [req.params.id, user_id || null, message]
            );

            const msgRow = result.rows[0];
            const userRole = getRLSContext(req).role;

            await logAudit(c, {
                actor_id: user_id,
                entity_type: 'DOCUMENT_REQUEST',
                entity_id: req.params.id,
                action: 'COMMENTED',
                data: msgRow
            });

            // Notify the requester that someone commented (if the comment isn't from the requester themselves)
            const drResult = await c.query('SELECT requester_id FROM document_requests WHERE id = $1', [req.params.id]);
            if (drResult.rows.length > 0 && drResult.rows[0].requester_id !== user_id) {
                await createNotification(c, userRole, {
                    recipient_id: drResult.rows[0].requester_id,
                    actor_id: user_id,
                    entity_type: 'DOCUMENT_REQUEST',
                    entity_id: req.params.id,
                    action: 'COMMENTED'
                });
            }

            res.status(201).json(msgRow);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/documents/attachments
router.post('/attachments', async (req, res) => {
    const { document_request_id, document_id, attached_by_id } = req.body;
    if (!document_request_id || !document_id || !attached_by_id) return res.status(400).json({ error: 'document_request_id, document_id, attached_by_id are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `INSERT INTO document_request_attachments (document_request_id, document_id, attached_by_id)
                 VALUES ($1, $2, $3) RETURNING *`,
                [document_request_id, document_id, attached_by_id]
            );

            const attRow = result.rows[0];
            const userRole = getRLSContext(req).role;

            await logAudit(c, {
                actor_id: attached_by_id,
                entity_type: 'DOCUMENT_REQUEST',
                entity_id: document_request_id,
                action: 'ATTACHED',
                data: attRow
            });

            const drResult = await c.query('SELECT requester_id FROM document_requests WHERE id = $1', [document_request_id]);
            if (drResult.rows.length > 0 && drResult.rows[0].requester_id !== attached_by_id) {
                await createNotification(c, userRole, {
                    recipient_id: drResult.rows[0].requester_id,
                    actor_id: attached_by_id,
                    entity_type: 'DOCUMENT_REQUEST',
                    entity_id: document_request_id,
                    action: 'ATTACHED'
                });
            }

            res.status(201).json(attRow);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/documents/attachments/all
router.get('/attachments/all', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { document_request_id } = req.query;
            let query = 'SELECT dra.*, d.name AS document_name, d.is_folder FROM document_request_attachments dra LEFT JOIN documents d ON d.id = dra.document_id WHERE 1=1';
            const params = [];
            if (document_request_id) { params.push(document_request_id); query += ` AND dra.document_request_id = $${params.length}`; }
            query += ' ORDER BY dra.created_at DESC';
            const result = await c.query(query, params);
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/documents/versions/all — must be before /:id routes
router.get('/versions/all', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM document_versions ORDER BY version DESC');
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/documents/shares/all — must be before /:id routes
router.get('/shares/all', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { document_id, department_id } = req.query;
            let query = 'SELECT ds.*, d.name AS document_name, d.is_folder FROM document_shares ds LEFT JOIN documents d ON d.id = ds.document_id WHERE 1=1';
            const params = [];
            if (document_id) { params.push(document_id); query += ` AND ds.document_id = $${params.length}`; }
            if (department_id) { params.push(department_id); query += ` AND ds.department_id = $${params.length}`; }
            query += ' ORDER BY ds.created_at DESC';
            const result = await c.query(query, params);
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/documents/attachments/:id
router.delete('/attachments/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            await c.query('DELETE FROM document_request_attachments WHERE id = $1', [req.params.id]);
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/documents/:id/versions
router.get('/:id/versions', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                'SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version DESC',
                [req.params.id]
            );
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/documents/:id/download
router.get('/:id/download', async (req, res) => {
    const client = await pool.connect();
    let fileName = 'file';
    let finalName = 'file';
    let physicalPath = null;

    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const docResult = await c.query('SELECT name, is_folder FROM documents WHERE id = $1', [req.params.id]);
            if (docResult.rows.length === 0) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            if (docResult.rows[0].is_folder) {
                res.status(400).json({ error: 'Is a folder, use download-zip' });
                return;
            }

            const verResult = await c.query('SELECT path FROM document_versions WHERE document_id = $1 ORDER BY version DESC LIMIT 1', [req.params.id]);
            if (verResult.rows.length === 0) {
                res.status(404).json({ error: 'No versions found' });
                return;
            }

            physicalPath = path.join(DOCUMENTS_PATH, verResult.rows[0].path);
            fileName = docResult.rows[0].name;
            const ext = path.extname(verResult.rows[0].path);
            finalName = fileName.includes('.') ? fileName : `${fileName}${ext}`;
        });

        if (res.headersSent) return;

        if (!physicalPath || !fs.existsSync(physicalPath)) {
            res.status(404).json({ error: 'Physical file not found' });
            return;
        }

        const safeFileName = fileName.replace(/[^\w\s.-]/g, '_');
        res.attachment(`${safeFileName}.zip`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            if (!res.headersSent) res.status(500).json({ error: err.message });
        });
        archive.pipe(res);
        archive.file(physicalPath, { name: finalName });
        await archive.finalize();
    } catch (err) {
        console.error('DOWNLOAD ERROR:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message, stack: err.stack });
        else res.end();
    } finally {
        client.release();
    }
});

// GET /api/documents/:id/view
router.get('/:id/view', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const docResult = await c.query('SELECT name, is_folder FROM documents WHERE id = $1', [req.params.id]);
            if (docResult.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
            if (docResult.rows[0].is_folder) return res.status(400).json({ error: 'Cannot view a folder' });

            const verResult = await c.query('SELECT path, mime_type FROM document_versions WHERE document_id = $1 ORDER BY version DESC LIMIT 1', [req.params.id]);
            if (verResult.rows.length === 0) return res.status(404).json({ error: 'No versions found' });

            const physicalPath = path.join(DOCUMENTS_PATH, verResult.rows[0].path);
            if (!fs.existsSync(physicalPath)) return res.status(404).json({ error: 'Physical file not found' });

            res.contentType(verResult.rows[0].mime_type || 'application/octet-stream');

            const fileStream = fs.createReadStream(physicalPath);
            fileStream.on('error', () => {
                if (!res.headersSent) res.status(500).json({ error: 'Error streaming file' });
            });
            fileStream.pipe(res);
        });
    } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


// GET /api/documents/:id/download-zip
router.get('/:id/download-zip', async (req, res) => {
    const client = await pool.connect();
    let folderName = 'folder';
    let fileRows = [];

    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const folderResult = await c.query('SELECT name, is_folder FROM documents WHERE id = $1', [req.params.id]);
            if (folderResult.rows.length === 0) {
                res.status(404).json({ error: 'Folder not found' });
                return;
            }
            if (!folderResult.rows[0].is_folder) {
                res.status(400).json({ error: 'Not a folder' });
                return;
            }
            folderName = folderResult.rows[0].name;

            // Bypass RLS for the tree traversal — document_versions is visible to admin/coordinator;
            // for others we rely on the documents RLS already filtering the parent.
            const result = await c.query(`
                WITH RECURSIVE DocumentTree AS (
                    SELECT id, parent_id, name, is_folder, CAST(name AS TEXT) AS relative_path
                    FROM documents
                    WHERE parent_id = $1
                    UNION ALL
                    SELECT d.id, d.parent_id, d.name, d.is_folder, CAST(dt.relative_path || '/' || d.name AS TEXT)
                    FROM documents d
                    INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                )
                SELECT dt.id, dt.name, dt.relative_path,
                       (SELECT dv.path FROM document_versions dv WHERE dv.document_id = dt.id ORDER BY dv.version DESC LIMIT 1) as physical_path
                FROM DocumentTree dt
                WHERE dt.is_folder = false;
            `, [req.params.id]);
            fileRows = result.rows;
        });

        // If the response was already sent (error case), stop here
        if (res.headersSent) return;

        if (fileRows.length === 0) {
            res.status(404).json({ error: 'Folder is empty or contains no valid files' });
            return;
        }

        const safeFolderName = folderName.replace(/[^\w\s.-]/g, '_');
        res.attachment(`${safeFolderName}.zip`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('ARCHIVER ERROR (ZIP):', err);
            if (!res.headersSent) res.status(500).json({ error: err.message });
            else res.end();
        });

        archive.on('warning', (err) => {
            console.warn('ARCHIVER WARNING (ZIP):', err);
        });

        archive.pipe(res);

        for (const file of fileRows) {
            if (file.physical_path) {
                const fullPath = path.join(DOCUMENTS_PATH, file.physical_path);
                if (fs.existsSync(fullPath)) {
                    archive.file(fullPath, { name: file.relative_path });
                }
            }
        }

        await archive.finalize();
    } catch (err) {
        console.error('DOWNLOAD-ZIP ERROR:', err.message, '| code:', err.code, '| detail:', err.detail);
        if (!res.headersSent) res.status(500).json({ error: err.message, code: err.code, detail: err.detail });
        else res.end();
    } finally {
        client.release();
    }
});

// POST /api/documents — Create a document record (folder or file metadata)
router.post('/', async (req, res) => {
    const { parent_id, uploader_id, name, comment, is_folder } = req.body;
    if (!uploader_id || !name) return res.status(400).json({ error: 'uploader_id and name are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `INSERT INTO documents (parent_id, uploader_id, name, comment, is_folder)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [parent_id || null, uploader_id, name, comment || null, is_folder || false]
            );

            await logAudit(c, {
                actor_id: uploader_id,
                entity_type: 'DOCUMENT',
                entity_id: result.rows[0].id,
                action: 'CREATED',
                data: result.rows[0]
            });

            res.status(201).json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/documents/:id/upload — Upload a physical file version
router.post('/:id/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { uploader_id, change_summary } = req.body;
    if (!uploader_id) return res.status(400).json({ error: 'uploader_id is required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            // Get current max version for this document
            const versionResult = await c.query(
                'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM document_versions WHERE document_id = $1',
                [req.params.id]
            );
            const nextVersion = versionResult.rows[0].next_version;

            const ext = path.extname(req.file.filename);
            const uuid = path.basename(req.file.filename, ext);

            const result = await c.query(
                `INSERT INTO document_versions
                    (id, document_id, uploader_id, version, path, size_bytes, mime_type, change_summary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [
                    uuid,
                    req.params.id,
                    uploader_id,
                    nextVersion,
                    req.file.filename, // UUID-obfuscated filename stored here
                    req.file.size,
                    req.file.mimetype,
                    change_summary || null,
                ]
            );

            await logAudit(c, {
                actor_id: uploader_id,
                entity_type: 'DOCUMENT_VERSION',
                entity_id: result.rows[0].id,
                action: 'UPLOADED',
                data: result.rows[0]
            });

            logger.success(`Document file uploaded successfully`, 'SYSTEM');

            res.status(201).json(result.rows[0]);

            // AI Background Processing
            const fullPath = path.join(DOCUMENTS_PATH, req.file.filename);
            processDocumentAI(req.params.id, result.rows[0].id, fullPath, req.file.mimetype, nextVersion).catch(e => {
                logger.error(`AI Background processing failed for doc ${req.params.id}: ${e.message}`, 'AI');
            });
        });
    } catch (err) {
        // Clean up the uploaded file if DB insert fails
        if (req.file) fs.unlink(path.join(DOCUMENTS_PATH, req.file.filename), () => { });
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/documents/:id/revert — Revert to a previous version
router.post('/:id/revert', async (req, res) => {
    const { version_id, uploader_id } = req.body;
    if (!version_id || !uploader_id) return res.status(400).json({ error: 'version_id and uploader_id are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const targetRes = await c.query('SELECT * FROM document_versions WHERE id = $1', [version_id]);
            if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Version not found' });

            const targetVersion = targetRes.rows[0];

            // Get newer versions to delete their physical files
            const newerVersions = await c.query(
                'SELECT path FROM document_versions WHERE document_id = $1 AND version > $2',
                [req.params.id, targetVersion.version]
            );

            for (const row of newerVersions.rows) {
                if (row.path) {
                    const fullPath = path.join(DOCUMENTS_PATH, row.path);
                    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                }
            }

            await c.query(
                'DELETE FROM document_versions WHERE document_id = $1 AND version > $2',
                [req.params.id, targetVersion.version]
            );
            res.status(200).json(targetVersion);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/documents/:id — Update a document record
router.patch('/:id', async (req, res) => {
    const { is_archived, parent_id, name, comment, summary } = req.body;
    const documentId = req.params.id;

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const updates = [];
            const params = [];
            let i = 1;

            if (is_archived !== undefined) { updates.push(`is_archived = $${i++}`); params.push(is_archived); }
            if (parent_id !== undefined) { updates.push(`parent_id = $${i++}`); params.push(parent_id === 'null' ? null : parent_id); }
            if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name); }
            if (comment !== undefined) { updates.push(`comment = $${i++}`); params.push(comment); }
            if (summary !== undefined) { updates.push(`summary = $${i++}`); params.push(summary); }

            if (updates.length === 0) return res.json({ message: 'No updates provided' });

            params.push(documentId);

            const query = `UPDATE documents SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`;
            const result = await c.query(query, params);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

            // If archiving/unarchiving a folder, cascade to all descendant documents
            if (is_archived !== undefined) {
                await c.query(`
                    WITH RECURSIVE DocumentTree AS (
                        SELECT id FROM documents WHERE id = $1
                        UNION ALL
                        SELECT d.id FROM documents d
                        INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                    )
                    UPDATE documents SET is_archived = $2
                    WHERE id IN (SELECT id FROM DocumentTree) AND id != $1
                `, [documentId, is_archived]);
            }

            await logAudit(c, {
                actor_id: getRLSContext(req).userId,
                entity_type: 'DOCUMENT',
                entity_id: documentId,
                action: is_archived !== undefined ? (is_archived ? 'ARCHIVED' : 'UNARCHIVED') : 'UPDATED',
                data: req.body
            });

            res.json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            // Find all descendant documents (including self)
            const docResult = await c.query(`
                WITH RECURSIVE DocumentTree AS (
                    SELECT id FROM documents WHERE id = $1
                    UNION ALL
                    SELECT d.id FROM documents d
                    INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                )
                SELECT id FROM DocumentTree;
            `, [req.params.id]);

            const docIds = docResult.rows.map(row => row.id);

            if (docIds.length > 0) {
                // Fetch all versions for these documents
                const verResult = await c.query(
                    `SELECT path FROM document_versions WHERE document_id = ANY($1)`,
                    [docIds]
                );

                // Delete the physical files
                for (const row of verResult.rows) {
                    if (row.path) {
                        const fullPath = path.join(DOCUMENTS_PATH, row.path);
                        if (fs.existsSync(fullPath)) {
                            fs.unlinkSync(fullPath);
                        }
                    }
                }
            }

            await c.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/documents/semantic-search — Semantic search for documents
router.post('/semantic-search', async (req, res) => {
    const { query, threshold = 0.5, limit = 10 } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const client = await pool.connect();
    try {
        // Embed the search query using the active embed model
        const queryEmbedding = await ollamaService.embed(query);
        if (!queryEmbedding) {
            return res.status(502).json({ error: 'Failed to generate embedding for search query' });
        }

        await withRLS(client, getRLSContext(req), async (c) => {
            // Using pgvector cosine distance operator <=>
            // The score is (1 - cosine_distance).
            // Example: `<=> '[1,2,3]'` returns distance. 1 - distance = similarity
            const result = await c.query(
                `SELECT d.*, 
                        (1 - (d.embedding <=> $1::vector)) as similarity_score
                 FROM documents d
                 WHERE d.is_folder = FALSE 
                   AND d.embedding IS NOT NULL
                   AND (1 - (d.embedding <=> $1::vector)) >= $2
                 ORDER BY d.embedding <=> $1::vector
                 LIMIT $3`,
                [`[${queryEmbedding.join(',')}]`, threshold, limit]
            );

            res.json(result.rows);
        });
    } catch (err) {
        logger.error(`Semantic search failed: ${err.message}`, 'SEARCH');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;

// ==============================================================================
// AI BACKGROUND PROCESSING
// ==============================================================================
async function processDocumentAI(documentId, versionId, physicalPath, mimeType, currentVersionNum) {
    const text = await textExtractor.extract(physicalPath, mimeType);
    if (!text) {
        logger.info(`No text extracted for document ${documentId}, skipping AI`, 'AI');
        return;
    }

    const client = await pool.connect();
    try {
        let summary = null;
        let changeSummary = null;

        // 1. Generate Summary (for all versions)
        const summaryLog = logger.progress(`Summarizing document...`, 'AI');
        summary = await ollamaService.generate(
            `Summarize this document concisely in one or two paragraphs:\n\n${text}`,
            (msg) => logger.updateProgress(summaryLog.id, msg)
        );
        if (summary) {
            logger.update(summaryLog.id, 'SUCCESS', `Document summarized successfully`);
        } else {
            logger.update(summaryLog.id, 'ERROR', `Failed to summarize document`);
        }

        // 2. Generate Change Summary (if it's an update)
        if (currentVersionNum > 1) {
            // Fetch previous version's text
            const prevVer = await client.query(
                'SELECT path, mime_type FROM document_versions WHERE document_id = $1 AND version = $2',
                [documentId, currentVersionNum - 1]
            );
            if (prevVer.rows.length > 0) {
                const prevPath = path.join(DOCUMENTS_PATH, prevVer.rows[0].path);
                const prevText = await textExtractor.extract(prevPath, prevVer.rows[0].mime_type);
                if (prevText) {
                    const diffLog = logger.progress(`Generating change summary...`, 'AI');
                    changeSummary = await ollamaService.generate(
                        `Compare these two versions of a document and provide a bulleted list of the key changes. Do not include any intro/outro text, just the bullet points.\n\n[PREVIOUS VERSION]\n${prevText}\n\n[NEW VERSION]\n${text}`,
                        (msg) => logger.updateProgress(diffLog.id, msg)
                    );
                    if (changeSummary) {
                        logger.update(diffLog.id, 'SUCCESS', `Change summary generated successfully`);
                    } else {
                        logger.update(diffLog.id, 'ERROR', `Failed to generate change summary`);
                    }
                }
            }
        }

        // 3. Generate Embeddings for Semantic Search
        // We embed the summary to save tokens and focus on core concepts, but we could embed the full text.
        const embedLog = logger.progress(`Embedding document...`, 'AI');
        const embedding = await ollamaService.embed(
            summary || text,
            (msg) => logger.updateProgress(embedLog.id, msg)
        );
        if (embedding) {
            logger.update(embedLog.id, 'SUCCESS', `Document embedded successfully`);
        } else {
            logger.update(embedLog.id, 'ERROR', `Failed to embed document`);
        }

        await client.query('BEGIN');

        if (summary || embedding) {
            let updateQuery = 'UPDATE documents SET ';
            const updates = [];
            const values = [documentId];
            let paramIdx = 2;

            if (summary) {
                updates.push(`summary = $${paramIdx++}`);
                values.push(summary);
            }
            if (embedding) {
                // formatting array as Postgres vector '[1,2,3]'
                updates.push(`embedding = $${paramIdx++}`);
                values.push(`[${embedding.join(',')}]`);
            }

            updateQuery += updates.join(', ') + ' WHERE id = $1';
            await client.query(updateQuery, values);
        }

        if (changeSummary) {
            await client.query(
                'UPDATE document_versions SET change_summary = $1 WHERE id = $2',
                [changeSummary, versionId]
            );
        }

        await client.query('COMMIT');
        logger.success(`AI Processing complete for document ${documentId}`, 'AI');

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
