/**
 * Investigation Step Definitions
 * Defines all investigation steps and their configurations
 */

import { SEARCH_QUERIES } from '../config.js';

export class InvestigationSteps {
    /**
     * Get all investigation steps for a brand
     * @param {string} brandName - Brand name to investigate
     * @param {string} productCategory - Product category
     * @returns {Array} Array of investigation step objects
     */
    static getSteps(brandName, productCategory) {
        return [
            {
                title: 'Registered Company Name',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4.5M16 22V4.5M8 22V4.5M12 4.5V2m0 2.5a5.14 5.14 0 0 1-5-5H2m15 5a5.14 5.14 0 0 0 5-5h-5.14"/></svg>`,
                query: SEARCH_QUERIES.getCompanyNameQuery(brandName),
                description: 'Finding official company registration and incorporation details.',
                step: 'companyName',
                priority: 'high'
            },
            {
                title: 'Founder Information',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
                query: SEARCH_QUERIES.getFounderQuery(brandName),
                description: 'Researching founder backgrounds and company history.',
                step: 'founders',
                priority: 'medium'
            },
            {
                title: 'Import Records',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
                query: SEARCH_QUERIES.getImportQuery(brandName),
                description: 'Analyzing import/export patterns and sourcing data.',
                step: 'imports',
                priority: 'high'
            },
            {
                title: 'Product Sourcing',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
                query: SEARCH_QUERIES.getSourcingQuery(brandName, productCategory),
                description: `Searching for similar ${productCategory} products on B2B platforms.`,
                step: 'sourcing',
                priority: 'high'
            }
        ];
    }

    /**
     * Get step by key
     * @param {string} stepKey - Step identifier
     * @param {string} brandName - Brand name
     * @param {string} productCategory - Product category
     * @returns {Object|null} Step object or null if not found
     */
    static getStepByKey(stepKey, brandName, productCategory) {
        const steps = this.getSteps(brandName, productCategory);
        return steps.find(step => step.step === stepKey) || null;
    }

    /**
     * Get high priority steps only
     * @param {string} brandName - Brand name
     * @param {string} productCategory - Product category
     * @returns {Array} Array of high priority investigation steps
     */
    static getHighPrioritySteps(brandName, productCategory) {
        return this.getSteps(brandName, productCategory)
            .filter(step => step.priority === 'high');
    }

    /**
     * Get total number of investigation steps
     * @returns {number} Total number of steps
     */
    static getTotalSteps() {
        return 4; // Number of investigation steps (excluding validation and final analysis)
    }
}