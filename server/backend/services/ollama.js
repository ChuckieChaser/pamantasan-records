import { logger } from './logger.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

class OllamaService {
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
        try {
            const response = await fetch(`${OLLAMA_URL}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
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
            
            return { success: true };
        } catch (error) {
            logger.error(`Failed to pull model ${modelName}: ${error.message}`, 'OLLAMA');
            throw error;
        }
    }
}

export const ollamaService = new OllamaService();
