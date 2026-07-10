import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from './logger.js';

export const textExtractor = {
    /**
     * Extracts text from a file based on its MIME type.
     * @param {string} physicalPath - Absolute path to the file on disk.
     * @param {string} mimeType - The MIME type of the file.
     * @returns {Promise<string>} The extracted text, or an empty string if unsupported/failed.
     */
    async extract(physicalPath, mimeType) {
        if (!fs.existsSync(physicalPath)) {
            logger.warn(`File not found for extraction: ${physicalPath}`, 'EXTRACTOR');
            return '';
        }

        try {
            if (mimeType === 'application/pdf') {
                return await this.extractPdf(physicalPath);
            } else if (
                mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                mimeType === 'application/msword'
            ) {
                return await this.extractDocx(physicalPath);
            } else if (mimeType.startsWith('text/')) {
                return await this.extractText(physicalPath);
            } else {
                logger.info(`Skipping extraction for unsupported mime type: ${mimeType}`, 'EXTRACTOR');
                return '';
            }
        } catch (err) {
            logger.error(`Extraction failed for ${physicalPath}: ${err.message}`, 'EXTRACTOR');
            return '';
        }
    },

    async extractPdf(physicalPath) {
        const dataBuffer = fs.readFileSync(physicalPath);
        const data = await pdfParse(dataBuffer);
        // Truncate to a reasonable limit (e.g., 20,000 characters) to prevent blowing up the LLM context
        return data.text ? data.text.substring(0, 20000).trim() : '';
    },

    async extractDocx(physicalPath) {
        const result = await mammoth.extractRawText({ path: physicalPath });
        return result.value ? result.value.substring(0, 20000).trim() : '';
    },

    async extractText(physicalPath) {
        const text = fs.readFileSync(physicalPath, 'utf8');
        return text ? text.substring(0, 20000).trim() : '';
    }
};
