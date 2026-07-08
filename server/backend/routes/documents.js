import { Router } from 'express';
import { pool, withRLS } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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
    userId:       req.headers['x-user-id'],
    role:         req.headers['x-user-role'],
    departmentId: req.headers['x-user-dept'],
});

// ==============================================================================
// DOCUMENTS ROUTES
// ==============================================================================

// GET /api/documents
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const { parent_id, status, is_folder } = req.query;
            let query = 'SELECT * FROM documents WHERE 1=1';
            const params = [];

            if (parent_id !== undefined) {
                params.push(parent_id === 'null' ? null : parent_id);
                query += ` AND parent_id ${parent_id === 'null' ? 'IS NULL' : `= $${params.length}`}`;
            }
            if (status)    { params.push(status);    query += ` AND status = $${params.length}`; }
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

            const result = await c.query(
                `INSERT INTO document_versions
                    (document_id, uploader_id, version, path, size_bytes, mime_type, change_summary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    req.params.id,
                    uploader_id,
                    nextVersion,
                    req.file.filename, // UUID-obfuscated filename stored here
                    req.file.size,
                    req.file.mimetype,
                    change_summary || null,
                ]
            );
            res.status(201).json(result.rows[0]);
        });
    } catch (err) {
        // Clean up the uploaded file if DB insert fails
        if (req.file) fs.unlink(path.join(DOCUMENTS_PATH, req.file.filename), () => {});
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PATCH /api/documents/:id
router.patch('/:id', async (req, res) => {
    const allowed = ['name', 'comment', 'status', 'summary', 'parent_id'];
    const updates = Object.entries(req.body)
        .filter(([k]) => allowed.includes(k))
        .map(([k, v], i) => [`${k} = $${i + 2}`, v]);

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `UPDATE documents SET ${updates.map(u => u[0]).join(', ')} WHERE id = $1 RETURNING *`,
                [req.params.id, ...updates.map(u => u[1])]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
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

// POST /api/documents/shares
router.post('/shares', async (req, res) => {
    const { document_id, sharer_id, recipient_id, department_id, document_request_id } = req.body;
    if (!document_id || !sharer_id) return res.status(400).json({ error: 'document_id and sharer_id are required' });
    if (!department_id && !document_request_id) return res.status(400).json({ error: 'Either department_id or document_request_id is required' });

    const client = await pool.connect();
    try {
        await withRLS(client, getRLSContext(req), async (c) => {
            const result = await c.query(
                `INSERT INTO document_shares (document_id, sharer_id, recipient_id, department_id, document_request_id)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [document_id, sharer_id, recipient_id || null, department_id || null, document_request_id || null]
            );
            res.status(201).json(result.rows[0]);
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
            if (status)       { params.push(status);        query += ` AND status = $${params.length}`; }
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
            res.status(201).json(result.rows[0]);
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
            res.json(result.rows[0]);
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
            res.status(201).json(result.rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
