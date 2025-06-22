/**
 * Serper API Client
 * Handles all interactions with the Serper search API
 */

import { CONFIG, MESSAGES } from '../config.js';

export class SerperAPI {
    /**
     * Search using Serper API
     * @param {string} query - Search query
     * @param {string} apiKey - Serper API key
     * @returns {Promise<Object>} Search results
     */
    static async search(query, apiKey) {
        const response = await fetch(CONFIG.APIS.SERPER, {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query })
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error(MESSAGES.ERRORS.INVALID_API_KEY);
            }
            throw new Error(`${MESSAGES.ERRORS.API_REQUEST_FAILED} with status ${response.status}`);
        }

        return response.json();
    }

    /**
     * Validate Serper API key format
     * @param {string} apiKey - API key to validate
     * @returns {boolean} True if format appears valid
     */
    static validateApiKey(apiKey) {
        return typeof apiKey === 'string' && apiKey.trim().length > 0;
    }
} 