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
            level: level.toUpperCase(), // INFO, SUCCESS, WARNING, ERROR, PROGRESS
            message,
            subMessage: '',
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

    progress(message, source = 'SYSTEM') {
        return this.log('PROGRESS', message, source);
    }

    update(id, level, message) {
        const index = this.logs.findIndex(l => l.id === id);
        if (index !== -1) {
            this.logs[index].level = level.toUpperCase();
            this.logs[index].message = message;
            this.logs[index].subMessage = ''; // Clear subMessage on completion
            this.logs[index].timestamp = new Date().toISOString(); // refresh timestamp

            this.emit('update_log', this.logs[index]);
            console.log(`[${this.logs[index].timestamp}] [${this.logs[index].level}] [${this.logs[index].source}] ${this.logs[index].message} (UPDATED)`);
        }
    }

    updateProgress(id, subMessage) {
        const index = this.logs.findIndex(l => l.id === id);
        if (index !== -1) {
            this.logs[index].subMessage = subMessage;
            this.emit('update_log', this.logs[index]);
            // Don't clutter console with subMessage updates
        }
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
        this.emit('clear_logs');
    }

    triggerRefresh(entityType = 'ALL') {
        this.emit('refresh_data', entityType);
    }
}

export const logger = new LoggerService();
