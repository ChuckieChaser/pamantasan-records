import { EventEmitter } from 'events';

class LoggerService extends EventEmitter {
    constructor() {
        super();
        this.logs = [];
    }

    log(level, message, source = 'SYSTEM') {
        const entry = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(), // INFO, SUCCESS, WARNING, ERROR
            message,
            source
        };

        this.logs.push(entry);
        
        // Keep only last 1000 logs in memory
        if (this.logs.length > 1000) {
            this.logs.shift();
        }

        // Emit event for WebSocket server to pick up
        this.emit('new_log', entry);
        
        console.log(`[${entry.timestamp}] [${entry.level}] [${entry.source}] ${entry.message}`);
        
        return entry;
    }

    info(message, source) {
        return this.log('INFO', message, source);
    }

    success(message, source) {
        return this.log('SUCCESS', message, source);
    }

    warn(message, source) {
        return this.log('WARNING', message, source);
    }

    error(message, source) {
        return this.log('ERROR', message, source);
    }

    getLogs() {
        return this.logs;
    }
}

export const logger = new LoggerService();
