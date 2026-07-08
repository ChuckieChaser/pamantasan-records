import { logger } from './logger.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

class OllamaService {
    constructor() {
        this.activePulls = new Map(); // modelName -> AbortController
    }

    async fetchModels() {
        try {
            const response = await fetch(`${OLLAMA_URL}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models from Ollama (Status: ${response.status})`);
            }
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            logger.error(`Ollama connection error: ${error.message}`, 'OLLAMA');
            return []; // Return empty if ollama is not reachable
        }
    }

    async pullModel(modelName, progressCallback) {
        logger.info(`Starting pull for model: ${modelName}`, 'OLLAMA');
        
        // Cancel any existing pull for this model
        this.cancelPull(modelName);

        const controller = new AbortController();
        this.activePulls.set(modelName, controller);

        try {
            const response = await fetch(`${OLLAMA_URL}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Failed to pull model ${modelName} (Status: ${response.status})`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let isDone = false;

            while (!isDone) {
                const { value, done } = await reader.read();
                isDone = done;
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (progressCallback) {
                                progressCallback(parsed);
                            }
                            if (parsed.status === 'success') {
                                logger.success(`Successfully pulled model: ${modelName}`, 'OLLAMA');
                            }
                        } catch (e) {
                            // ignore partial JSON
                        }
                    }
                }
            }
            
            this.activePulls.delete(modelName);
            return { success: true };
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.info(`Pull cancelled for model: ${modelName}`, 'OLLAMA');
                this.activePulls.delete(modelName);
                throw new Error('Pull cancelled');
            }
            logger.error(`Failed to pull model ${modelName}: ${error.message}`, 'OLLAMA');
            this.activePulls.delete(modelName);
            throw error;
        }
    }

    cancelPull(modelName) {
        if (this.activePulls.has(modelName)) {
            this.activePulls.get(modelName).abort();
            this.activePulls.delete(modelName);
            return true;
        }
        return false;
    }

    async deleteModel(modelName) {
        logger.info(`Starting delete for model: ${modelName}`, 'OLLAMA');
        try {
            const response = await fetch(`${OLLAMA_URL}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            });

            if (!response.ok) {
                throw new Error(`Failed to delete model ${modelName} (Status: ${response.status})`);
            }
            logger.success(`Successfully deleted model: ${modelName}`, 'OLLAMA');
            return { success: true };
        } catch (error) {
            logger.error(`Failed to delete model ${modelName}: ${error.message}`, 'OLLAMA');
            throw error;
        }
    }
}

export const ollamaService = new OllamaService();
