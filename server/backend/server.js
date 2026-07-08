import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { logger } from './services/logger.js';
import { ollamaService } from './services/ollama.js';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 5000;

// Setup DB Pool
const pool = new Pool({
    user: 'admin',
    password: 'admin',
    host: '127.0.0.1',
    port: 5433,
    database: 'pamantasan_records'
});

let lastClientPing = 0;

// Middleware
app.use(cors());
app.use(express.json());

// Track client connection
app.use((req, res, next) => {
    // If request comes from an external IP (not localhost), assume it's the client laptop
    const ip = req.ip || req.connection.remoteAddress;
    if (ip && !ip.includes('127.0.0.1') && !ip.includes('::1') && !ip.includes('::ffff:127.0.0.1')) {
        lastClientPing = Date.now();
    }
    next();
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/status', async (req, res) => {
    let dbOnline = false;
    try {
        await pool.query('SELECT 1');
        dbOnline = true;
    } catch (e) {
        // ignore
    }

    let ollamaOnline = false;
    try {
        await ollamaService.fetchModels();
        ollamaOnline = true;
    } catch (e) {
        // ignore
    }

    // Client is online if we've seen a request from them in the last 60 seconds
    const clientOnline = (Date.now() - lastClientPing) < 60000;

    res.json({
        postgres: dbOnline,
        ollama: ollamaOnline,
        client: clientOnline
    });
});

app.get('/api/models', async (req, res) => {
    const models = await ollamaService.fetchModels();
    res.json({ models });
});

app.post('/api/pull', async (req, res) => {
    const { modelName } = req.body;
    if (!modelName) {
        return res.status(400).json({ error: 'Model name is required' });
    }

    // Start pulling in the background
    // We don't await this so the request doesn't hang, progress is sent via WebSockets
    try {
        ollamaService.pullModel(modelName, (progress) => {
            // Emit a specific event for pull progress, handled by WebSockets
            logger.emit('model_progress', { modelName, progress });
        }).catch(err => {
            if (err.message === 'Pull cancelled') {
                logger.emit('model_progress', { modelName, progress: { status: 'cancelled' } });
            }
        });
        logger.success('Pull request sent successfully', 'API');
        res.json({ message: 'Pull initiated', modelName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pull/cancel', (req, res) => {
    const { modelName } = req.body;
    if (!modelName) return res.status(400).json({ error: 'Model name is required' });
    
    const cancelled = ollamaService.cancelPull(modelName);
    if (cancelled) {
        res.json({ message: 'Pull cancelled' });
    } else {
        res.status(404).json({ error: 'No active pull found for this model' });
    }
});

// DELETE /api/delete - Delete an Ollama model
app.delete('/api/delete', async (req, res) => {
    const { modelName } = req.body;
    if (!modelName) {
        logger.warning('Delete request missing modelName', 'API');
        return res.status(400).json({ error: 'modelName is required' });
    }

    try {
        await ollamaService.deleteModel(modelName);
        res.json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket Server
const wss = new WebSocketServer({ server, path: '/logs' });

wss.on('connection', (ws) => {
    logger.info('New WebSocket connection established', 'WEBSOCKET');

    // Send existing logs immediately on connection
    ws.send(JSON.stringify({ type: 'INIT_LOGS', data: logger.getLogs() }));

    // Setup listener for new logs
    const onNewLog = (logEntry) => {
        ws.send(JSON.stringify({ type: 'NEW_LOG', data: logEntry }));
    };

    // Setup listener for model progress
    const onModelProgress = (payload) => {
        ws.send(JSON.stringify({ type: 'MODEL_PROGRESS', data: payload }));
    };

    logger.on('new_log', onNewLog);
    logger.on('model_progress', onModelProgress);

    ws.on('close', () => {
        logger.removeListener('new_log', onNewLog);
        logger.removeListener('model_progress', onModelProgress);
    });
});

// Start Server
server.listen(port, () => {
    console.log(`Backend Server running on port ${port}`);
    logger.info(`Server initialized and listening on port ${port}`, 'SYSTEM');
});
