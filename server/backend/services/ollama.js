import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

class OllamaService {
    constructor() {
        this.activePulls = new Map(); // modelName -> AbortController
        
        this.configPath = path.join(process.cwd(), '.ollama_models.json');
        
        this.activeModels = {
            summarize: process.env.OLLAMA_SUMMARIZE_MODEL || 'llama3',
            embed: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'
        };

        try {
            if (fs.existsSync(this.configPath)) {
                const saved = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.activeModels = { ...this.activeModels, ...saved };
            }
        } catch (e) {
            logger.warn('Failed to load saved models config', 'OLLAMA');
        }
    }

    getActiveModels() {
        return this.activeModels;
    }

    setActiveModel(type, modelName) {
        if (type === 'summarize' || type === 'embed') {
            this.activeModels[type] = modelName;
            logger.info(`Active ${type} model set to: ${modelName}`, 'OLLAMA');
            try {
                fs.writeFileSync(this.configPath, JSON.stringify(this.activeModels, null, 2));
            } catch (e) {
                logger.error('Failed to save models config', 'OLLAMA');
            }
            return true;
        }
        return false;
    }

    async generate(prompt, onProgress) {
        const model = this.activeModels.summarize;
        logger.info(`Generating completion using model: ${model}`, 'OLLAMA');
        try {
            if (onProgress) onProgress('Connecting to AI model...');
            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false
                })
            });

            if (onProgress) onProgress('Waiting for response...');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate (Status: ${response.status}) - ${errorText}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            logger.error(`Generation error with ${model}: ${error.message}`, 'OLLAMA');
            return null; // Gracefully fail
        }
    }

    async embed(text, onProgress) {
        const model = this.activeModels.embed;
        try {
            if (onProgress) onProgress('Connecting to AI model...');
            const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    prompt: text
                })
            });

            if (onProgress) onProgress('Waiting for response...');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to embed (Status: ${response.status}) - ${errorText}`);
            }

            const data = await response.json();
            return data.embedding;
        } catch (error) {
            logger.error(`Embedding error with ${model}: ${error.message}`, 'OLLAMA');
            return null; // Gracefully fail
        }
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
                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }
                            if (progressCallback) {
                                // Strip out layer-level success so we don't trigger premature completion in the frontend
                                if (parsed.status === 'success') {
                                    parsed.status = 'layer_success';
                                }
                                progressCallback(parsed);
                            }
                        } catch (e) {
                            if (e.message && !e.message.includes('JSON')) {
                                throw e; // Throw actual ollama stream errors
                            }
                            // ignore partial JSON
                        }
                    }
                }
            }
            
            this.activePulls.delete(modelName);
            // Wait a split second to ensure final logs are flushed, then emit final success
            setTimeout(() => {
                if (progressCallback) {
                    progressCallback({ status: 'success' });
                }
                logger.success(`Successfully pulled model: ${modelName}`, 'OLLAMA');
            }, 500);
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
