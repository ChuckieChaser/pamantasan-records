import { Router } from 'express';
import { logger } from '../services/logger.js';

const router = Router();

// DELETE /api/logs - Clear all in-memory server logs
router.delete('/', (_req, res) => {
    logger.clearLogs();
    res.json({ success: true, message: 'Logs cleared' });
});

export default router;
