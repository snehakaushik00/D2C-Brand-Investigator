/**
 * DOM Manager
 * Centralized management of all DOM elements and interactions
 */

export class DOMManager {
    constructor() {
        this.elements = this.initializeElements();
        this.setupEventListeners();
    }

    /**
     * Initialize all DOM elements
     * @returns {Object} Object containing all DOM element references
     */
    initializeElements() {
        return {
            // Input elements
            apiKeys: {
                serper: document.getElementById('serperApiKey'),
                gemini: document.getElementById('geminiApiKey'),
                firecrawl: document.getElementById('firecrawlApiKey'),
                rapidapi: document.getElementById('rapidApiKey')
            },
            brandName: document.getElementById('brandName'),
            productCategory: document.getElementById('productCategory'),

            // Buttons
            investigateBtn: document.getElementById('investigateBtn'),
            downloadReportBtn: document.getElementById('downloadReportBtn'),

            // Display sections
            status: document.getElementById('status'),
            results: document.getElementById('results'),
            summary: document.getElementById('summary'),
            summaryContent: document.getElementById('summaryContent'),
            aiSummary: document.getElementById('aiSummary'),
            aiSummaryContent: document.getElementById('aiSummaryContent'),
            disclaimer: document.getElementById('disclaimer'),

            // Progress elements
            progressSection: document.getElementById('progressSection'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),
            progressBar: document.getElementById('progressBar')
        };
    }

    /**
     * Setup event listeners for interactive elements
     */
    setupEventListeners() {
        // Button click events will be handled by the main app
        // This method can be extended for common DOM interactions

        // Handle Enter key presses
        this.elements.brandName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.elements.investigateBtn.click();
            }
        });

        this.elements.productCategory.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.elements.investigateBtn.click();
            }
        });
    }

    /**
     * Get API key values from inputs
     * @returns {Object} Object containing API key values
     */
    getApiKeys() {
        return {
            serper: this.elements.apiKeys.serper.value.trim(),
            gemini: this.elements.apiKeys.gemini.value.trim(),
            firecrawl: this.elements.apiKeys.firecrawl.value.trim(),
            rapidapi: this.elements.apiKeys.rapidapi.value.trim()
        };
    }

    /**
     * Set API key values in inputs
     * @param {Object} apiKeys - Object containing API key values
     */
    setApiKeys(apiKeys) {
        if (apiKeys.serper) this.elements.apiKeys.serper.value = apiKeys.serper;
        if (apiKeys.gemini) this.elements.apiKeys.gemini.value = apiKeys.gemini;
        if (apiKeys.firecrawl) this.elements.apiKeys.firecrawl.value = apiKeys.firecrawl;
        if (apiKeys.rapidapi) this.elements.apiKeys.rapidapi.value = apiKeys.rapidapi;
    }

    /**
     * Get investigation inputs
     * @returns {Object} Object containing brand name and product category
     */
    getInvestigationInputs() {
        return {
            brandName: this.elements.brandName.value.trim(),
            productCategory: this.elements.productCategory.value.trim() || 'products'
        };
    }

    /**
     * Show status message
     * @param {string} htmlContent - HTML content to display
     * @param {string} type - Type of status (error, success, info)
     */
    showStatus(htmlContent, type = 'info') {
        this.elements.status.innerHTML = htmlContent;
        this.elements.status.className = 'text-center my-6';

        if (type === 'error') {
            this.elements.status.classList.add('p-3', 'bg-red-100', 'text-red-700', 'rounded-md');
        } else if (type === 'success') {
            this.elements.status.classList.add('p-3', 'bg-green-100', 'text-green-700', 'rounded-md');
        }

        this.elements.status.classList.remove('hidden');
    }

    /**
     * Hide status display
     */
    hideStatus() {
        this.elements.status.classList.add('hidden');
    }

    /**
     * Reset UI for new investigation
     */
    resetForNewInvestigation() {
        this.hideStatus();
        this.elements.disclaimer.classList.add('hidden');
        this.elements.results.classList.add('hidden');
        this.elements.summary.classList.add('hidden');
        this.elements.aiSummary.classList.add('hidden');
        this.elements.progressSection.classList.remove('hidden');
    }

    /**
     * Show investigation results
     */
    showResults() {
        this.elements.progressSection.classList.add('hidden');
        this.elements.disclaimer.classList.remove('hidden');
        this.elements.results.classList.remove('hidden');
        this.elements.aiSummary.classList.remove('hidden');
    }

    /**
     * Enable/disable investigate button
     * @param {boolean} enabled - Whether button should be enabled
     */
    setInvestigateButtonState(enabled) {
        this.elements.investigateBtn.disabled = !enabled;
    }

    /**
     * Clear results display
     */
    clearResults() {
        this.elements.results.innerHTML = '';
        this.elements.summaryContent.innerHTML = '';
        this.elements.aiSummaryContent.innerHTML = '';
    }
} 