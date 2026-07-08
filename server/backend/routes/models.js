import { Router } from 'express';
import { logger } from '../services/logger.js';
import { ollamaService } from '../services/ollama.js';

const router = Router();

// GET /api/models - List all locally installed Ollama models
router.get('/', async (_req, res) => {
    try {
        const models = await ollamaService.fetchModels();
        res.json({ models });
    } catch (err) {
        res.status(502).json({ error: 'Failed to reach Ollama service', detail: err.message });
    }
});

// POST /api/models/pull - Start a background model pull (progress via WebSocket)
router.post('/pull', async (req, res) => {
    const { modelName } = req.body;
    if (!modelName || typeof modelName !== 'string' || !modelName.trim()) {
        return res.status(400).json({ error: 'modelName is required' });
    }

    const name = modelName.trim();

    // Fire-and-forget — progress is streamed via WebSocket MODEL_PROGRESS events
    ollamaService.pullModel(name, (progress) => {
        logger.emit('model_progress', { modelName: name, progress });
    }).then(() => {
        // Success is emitted from inside ollama.js after the 500ms delay
    }).catch((err) => {
        if (err.message === 'Pull cancelled') {
            logger.emit('model_progress', { modelName: name, progress: { status: 'cancelled' } });
            logger.info(`Pull cancelled for model: ${name}`, 'MODEL');
        } else {
            logger.emit('model_progress', { modelName: name, progress: { status: 'error' } });
            logger.error(`Pull failed for model: ${name} — ${err.message}`, 'MODEL');
        }
    });

    // Respond immediately — the frontend tracks progress via WS
    logger.info(`Pull initiated for model: ${name}`, 'MODEL');
    res.json({ message: 'Pull initiated', modelName: name });
});

// POST /api/models/cancel - Cancel an in-progress pull
router.post('/cancel', (req, res) => {
    const { modelName } = req.body;
    if (!modelName) return res.status(400).json({ error: 'modelName is required' });

    const cancelled = ollamaService.cancelPull(modelName);
    if (cancelled) {
        res.json({ message: 'Pull cancelled', modelName });
    } else {
        res.status(404).json({ error: 'No active pull found for this model' });
    }
});

// DELETE /api/models - Delete an installed Ollama model
router.delete('/', async (req, res) => {
    const { modelName } = req.body;
    if (!modelName) return res.status(400).json({ error: 'modelName is required' });

    try {
        await ollamaService.deleteModel(modelName);
        logger.info(`Model deleted: ${modelName}`, 'MODEL');
        res.json({ success: true, message: `Model ${modelName} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
