import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { logger } from './services/logger.js';
import { ollamaService } from './services/ollama.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
    ollamaService.pullModel(modelName, (progress) => {
        // Emit a specific event for pull progress, handled by WebSockets
        logger.emit('model_progress', { modelName, progress });
    }).catch(err => {
        // Errors are already logged in the service
    });

    res.json({ status: 'Pulling started', modelName });
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
