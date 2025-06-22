/**
 * Storage Manager
 * Handles all localStorage operations for API keys and data persistence
 */

import { CONFIG } from '../config.js';

export class StorageManager {
    /**
     * Save API key to localStorage
     * @param {string} keyType - Type of API key (serper, gemini, firecrawl, rapidapi)
     * @param {string} apiKey - API key value
     */
    static saveApiKey(keyType, apiKey) {
        const storageKey = CONFIG.STORAGE_KEYS[`${keyType.toUpperCase()}_API_KEY`];
        if (storageKey && apiKey) {
            localStorage.setItem(storageKey, apiKey);
        }
    }

    /**
     * Load API key from localStorage
     * @param {string} keyType - Type of API key
     * @returns {string|null} API key value or null if not found
     */
    static loadApiKey(keyType) {
        const storageKey = CONFIG.STORAGE_KEYS[`${keyType.toUpperCase()}_API_KEY`];
        return storageKey ? localStorage.getItem(storageKey) : null;
    }

    /**
     * Load all API keys from localStorage
     * @returns {Object} Object containing all stored API keys
     */
    static loadAllApiKeys() {
        return {
            serper: this.loadApiKey('serper'),
            gemini: this.loadApiKey('gemini'),
            firecrawl: this.loadApiKey('firecrawl'),
            rapidapi: this.loadApiKey('rapidapi')
        };
    }

    /**
     * Save all API keys at once
     * @param {Object} apiKeys - Object containing API keys
     */
    static saveAllApiKeys(apiKeys) {
        Object.keys(apiKeys).forEach(key => {
            if (apiKeys[key]) {
                this.saveApiKey(key, apiKeys[key]);
            }
        });
    }

    /**
     * Clear specific API key
     * @param {string} keyType - Type of API key to clear
     */
    static clearApiKey(keyType) {
        const storageKey = CONFIG.STORAGE_KEYS[`${keyType.toUpperCase()}_API_KEY`];
        if (storageKey) {
            localStorage.removeItem(storageKey);
        }
    }

    /**
     * Clear all stored API keys
     */
    static clearAllApiKeys() {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    /**
     * Check if required API keys are available
     * @param {Object} apiKeys - Object containing API keys to check
     * @returns {boolean} True if required keys are present
     */
    static hasRequiredKeys(apiKeys) {
        return !!(apiKeys.serper && apiKeys.gemini);
    }

    /**
     * Check if optional API keys are available
     * @param {Object} apiKeys - Object containing API keys to check
     * @returns {Object} Object indicating which optional keys are available
     */
    static getOptionalKeysStatus(apiKeys) {
        return {
            firecrawl: !!(apiKeys.firecrawl),
            rapidapi: !!(apiKeys.rapidapi)
        };
    }
} 