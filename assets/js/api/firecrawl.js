/**
 * Firecrawl API Client
 * Handles all interactions with the Firecrawl web scraping API
 */

import { CONFIG, MESSAGES } from '../test-made-in-india-main/assets/js/config.js';

export class FirecrawlAPI {
    /**
     * Scrape and parse web content using Firecrawl v1 API
     * @param {string} url - URL to scrape
     * @param {string} apiKey - Firecrawl API key
     * @returns {Promise<Object>} Parsed content with markdown, HTML, and metadata
     */
    static async scrapeContent(url, apiKey) {
        const response = await fetch(CONFIG.APIS.FIRECRAWL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                formats: ["markdown", "html"]
            })
        });

        if (!response.ok) {
            throw new Error(`${MESSAGES.ERRORS.FIRECRAWL_API_FAILED}: ${response.status}`);
        }

        const result = await response.json();

        // Handle v1 API response structure
        if (result.success && result.data) {
            return {
                success: true,
                markdown: result.data.markdown,
                html: result.data.html,
                metadata: result.data.metadata || {},
                title: result.data.metadata?.title || '',
                description: result.data.metadata?.description || ''
            };
        } else {
            throw new Error(`${MESSAGES.ERRORS.FIRECRAWL_API_ERROR}: ${result.error || 'Unknown error'}`);
        }
    }

    /**
     * Safely attempt to scrape content with error handling
     * @param {string} url - URL to scrape
     * @param {string} apiKey - Firecrawl API key
     * @returns {Promise<Object|null>} Parsed content or null if failed
     */
    static async safeScrapeContent(url, apiKey) {
        try {
            return await this.scrapeContent(url, apiKey);
        } catch (error) {
            console.log(`Firecrawl failed for ${url}:`, error.message);
            return null;
        }
    }

    /**
     * Validate Firecrawl API key format
     * @param {string} apiKey - API key to validate
     * @returns {boolean} True if format appears valid
     */
    static validateApiKey(apiKey) {
        return typeof apiKey === 'string' && apiKey.trim().length > 0;
    }

    /**
     * Check if URL is suitable for Firecrawl scraping
     * @param {string} url - URL to check
     * @returns {boolean} True if URL appears scrapeable
     */
    static isScrapeableUrl(url) {
        try {
            const urlObj = new URL(url);
            // Skip URLs that are likely to be problematic
            const problematicDomains = ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com'];
            return !problematicDomains.some(domain => urlObj.hostname.includes(domain));
        } catch {
            return false;
        }
    }
} 