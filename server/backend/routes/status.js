import { Router } from 'express';
import { pool } from '../db.js';
import { ollamaService } from '../services/ollama.js';

const router = Router();

// GET /api/health - Simple uptime check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/status - Live connectivity status for all services
router.get('/status', async (req, res) => {
    let dbOnline = false;
    try {
        await pool.query('SELECT 1');
        dbOnline = true;
    } catch (_e) {
        // Postgres is unreachable
    }

    let ollamaOnline = false;
    try {
        await ollamaService.fetchModels();
        ollamaOnline = true;
    } catch (_e) {
        // Ollama is unreachable
    }

    // Client is considered online if the server received a request from it in the last 60 seconds
    const lastPing = req.app.get('lastClientPing') || 0;
    const clientOnline = (Date.now() - lastPing) < 60000;

    res.json({ postgres: dbOnline, ollama: ollamaOnline, client: clientOnline });
});

export default router;
