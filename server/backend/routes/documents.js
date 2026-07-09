import { Router } from 'express';
import { pool, withRLS } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { logAudit } from '../services/audit.js';
import { createNotification } from '../services/notification.js';
import { createRequire } from 'module';
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
    userId: req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000',
    role: req.headers['x-user-role'] || 'ANONYMOUS',
    departmentId: req.headers['x-user-dept'] || '00000000-0000-0000-0000-000000000000',
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
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const docResult = await c.query('SELECT name, is_folder FROM documents WHERE id = $1', [req.params.id]);
            if (docResult.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
            if (docResult.rows[0].is_folder) return res.status(400).json({ error: 'Is a folder, use download-zip' });

            const verResult = await c.query('SELECT path FROM document_versions WHERE document_id = $1 ORDER BY version DESC LIMIT 1', [req.params.id]);
            if (verResult.rows.length === 0) return res.status(404).json({ error: 'No versions found' });

            const physicalPath = path.join(DOCUMENTS_PATH, verResult.rows[0].path);
            if (!fs.existsSync(physicalPath)) return res.status(404).json({ error: 'Physical file not found' });

            res.download(physicalPath, docResult.rows[0].name);
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
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            // Check if document exists and is a folder
            const folderResult = await c.query('SELECT name, is_folder FROM documents WHERE id = $1', [req.params.id]);
            if (folderResult.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
            if (!folderResult.rows[0].is_folder) return res.status(400).json({ error: 'Not a folder' });

            const folderName = folderResult.rows[0].name;

            // Recursive CTE to get all files and their logical relative paths
            const result = await c.query(`
                WITH RECURSIVE DocumentTree AS (
                    SELECT id, parent_id, name, is_folder, name::text AS relative_path
                    FROM documents
                    WHERE parent_id = $1
                    UNION ALL
                    SELECT d.id, d.parent_id, d.name, d.is_folder, (dt.relative_path || '/' || d.name)
                    FROM documents d
                    INNER JOIN DocumentTree dt ON d.parent_id = dt.id
                )
                SELECT dt.id, dt.name, dt.relative_path,
                       (SELECT path FROM document_versions dv WHERE dv.document_id = dt.id ORDER BY version DESC LIMIT 1) as physical_path
                FROM DocumentTree dt
                WHERE dt.is_folder = false;
            `, [req.params.id]);

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);

            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('error', (err) => { throw err; });
            archive.pipe(res);

            for (const file of result.rows) {
                if (file.physical_path) {
                    const fullPath = path.join(DOCUMENTS_PATH, file.physical_path);
                    if (fs.existsSync(fullPath)) {
                        archive.file(fullPath, { name: file.relative_path });
                    }
                }
            }

            await archive.finalize();
        });
    } catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
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

            res.status(201).json(result.rows[0]);
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

            const versionResult = await c.query(
                'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM document_versions WHERE document_id = $1',
                [req.params.id]
            );
            const nextVersion = versionResult.rows[0].next_version;

            const newId = crypto.randomUUID();

            const result = await c.query(
                `INSERT INTO document_versions
                    (id, document_id, uploader_id, version, path, size_bytes, mime_type, change_summary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [
                    newId,
                    req.params.id,
                    uploader_id,
                    nextVersion,
                    targetVersion.path,
                    targetVersion.size_bytes,
                    targetVersion.mime_type,
                    `Reverted to version ${targetVersion.version}`,
                ]
            );
            res.status(201).json(result.rows[0]);
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

// ==============================================================================
// DOCUMENT SHARES ROUTES
// ==============================================================================

// GET /api/documents/shares/all
router.get('/shares/all', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query('SELECT * FROM document_shares ORDER BY created_at DESC');
            res.json(result.rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/documents/shares — Share a document (and cascade to children)
router.post('/shares', async (req, res) => {
    const { document_id, sharer_id, recipient_id, department_id, document_request_id } = req.body;
    if (!document_id || !sharer_id) return res.status(400).json({ error: 'document_id and sharer_id are required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            // Find all descendants of the document
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
                    `INSERT INTO document_shares (document_id, sharer_id, recipient_id, department_id, document_request_id)
                     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [docRow.id, sharer_id, recipient_id || null, department_id || null, document_request_id || null]
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
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `UPDATE document_shares SET status = $1 WHERE id = $2 RETURNING *`,
                [status, req.params.id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Share not found' });
            
            const share = result.rows[0];
            const userId = getRLSContext(req).userId;
            const userRole = getRLSContext(req).role;

            // 1. Cross-update document_versions for Approvals/Publishing
            if (['APPROVED', 'PUBLISHED', 'REJECTED'].includes(status)) {
                let updateField = '';
                if (status === 'APPROVED') updateField = 'approver_id';
                if (status === 'PUBLISHED') updateField = 'publisher_id';
                if (status === 'REJECTED') updateField = 'rejecter_id';

                await c.query(
                    `UPDATE document_versions 
                     SET ${updateField} = $1 
                     WHERE document_id = $2 
                     AND version = (SELECT MAX(version) FROM document_versions WHERE document_id = $2)`,
                    [userId, share.document_id]
                );
            }

            // 2. Audit Log
            await logAudit(c, {
                actor_id: userId,
                entity_type: 'DOCUMENT',
                entity_id: share.document_id,
                action: status, // status enum matches action enum directly! (APPROVED, PUBLISHED, REJECTED)
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

            res.json(share);
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
            await c.query('DELETE FROM document_shares WHERE id = $1', [req.params.id]);
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

export default router;
