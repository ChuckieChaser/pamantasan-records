import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';

import { logger } from './services/logger.js';
import statusRouter       from './routes/status.js';
import modelsRouter       from './routes/models.js';
import logsRouter         from './routes/logs.js';
import authRouter         from './routes/auth.js';
import usersRouter        from './routes/users.js';
import departmentsRouter  from './routes/departments.js';
import documentsRouter    from './routes/documents.js';
import coordinatorsRouter from './routes/coordinators.js';
import notificationsRouter from './routes/notifications.js';
import auditsRouter       from './routes/audits.js';

// ==============================================================================
// SERVER SETUP
// ==============================================================================

const app  = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/avatars', express.static(process.env.AVATARS_PATH || 'D:/records/avatars'));

// --- Client-presence tracker ---
// Any non-localhost request is assumed to be from the client laptop.
// Used by /api/status to report the client indicator.
app.use((req, _res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const isLocal = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('::ffff:127.0.0.1');
    if (!isLocal) {
        app.set('lastClientPing', Date.now());
    }
    next();
});

// ==============================================================================
// ROUTES
// ==============================================================================

app.use('/api',              statusRouter);
app.use('/api/models',       modelsRouter);
app.use('/api/logs',         logsRouter);
app.use('/api/auth',         authRouter);
app.use('/api/users',        usersRouter);
app.use('/api/departments',  departmentsRouter);
app.use('/api/documents',    documentsRouter);
app.use('/api/coordinators', coordinatorsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/audits',       auditsRouter);

// ==============================================================================
// WEBSOCKET SERVER (Real-time log streaming & model progress)
// ==============================================================================

const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/logs' });

wss.on('connection', (ws) => {
    logger.info('WebSocket client connected', 'WEBSOCKET');

    // Send all existing logs immediately on connection
    ws.send(JSON.stringify({ type: 'INIT_LOGS', data: logger.getLogs() }));

    const onNewLog      = (entry)   => ws.send(JSON.stringify({ type: 'NEW_LOG',       data: entry }));
    const onModelProgress = (payload) => ws.send(JSON.stringify({ type: 'MODEL_PROGRESS', data: payload }));
    const onClearLogs   = ()        => ws.send(JSON.stringify({ type: 'INIT_LOGS',     data: [] }));

    logger.on('new_log',      onNewLog);
    logger.on('model_progress', onModelProgress);
    logger.on('clear_logs',   onClearLogs);

    ws.on('close', () => {
        logger.removeListener('new_log',       onNewLog);
        logger.removeListener('model_progress',  onModelProgress);
        logger.removeListener('clear_logs',    onClearLogs);
    });
});

// ==============================================================================
// START
// ==============================================================================

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    logger.info(`Server initialized on port ${port}`, 'SYSTEM');
});
