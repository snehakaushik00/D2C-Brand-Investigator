/**
 * Configuration and Constants for D2C Brand Investigator
 */

export const CONFIG = {
    // API Endpoints
    APIS: {
        SERPER: 'https://google.serper.dev/search',
        GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        FIRECRAWL: 'https://api.firecrawl.dev/v1/scrape',
        RAPIDAPI_LINKEDIN: 'https://rapidapi.com/freshdata-freshdata-default/api/fresh-linkedin-profile-data'


    },

    // Investigation Steps Configuration
    INVESTIGATION_STEPS: {
        TOTAL_STEPS: 6,
        VALIDATION_STEP: 1,
        INVESTIGATION_STEPS: 4,
        FINAL_ANALYSIS_STEP: 6
    },

    // Local Storage Keys
    STORAGE_KEYS: {
        SERPER_API_KEY: 'serperApiKey',
        GEMINI_API_KEY: 'geminiApiKey',
        FIRECRAWL_API_KEY: 'firecrawlApiKey',
        RAPIDAPI_KEY: 'rapidApiKey'
    },

    // UI Configuration
    UI: {
        PROGRESS_ANIMATION_DURATION: 300,
        CARD_TRANSITION_DURATION: 300,
        MAX_SEARCH_RESULTS_DISPLAY: 3,
        MAX_FIRECRAWL_CONTENT_LENGTH: 2000,
        MAX_LINKEDIN_PROFILES: 3
    },

    // PDF Generation Settings
    PDF: {
        PAGE_SIZE: 'A4',
        PAGE_MARGINS: [40, 60, 40, 60],
        FONT_SIZES: {
            TITLE: 20,
            SECTION_HEADER: 16,
            STEP_HEADER: 14,
            SUBHEADER: 12,
            BODY: 11,
            SMALL: 10,
            TINY: 9,
            FOOTER: 8
        }
    },

    // Step Titles Mapping
    STEP_TITLES: {
        companyName: 'Registered Company Name',
        founders: 'Founder Information',
        imports: 'Import Records',
        sourcing: 'Product Sourcing'
    },

    // Risk Assessment Thresholds
    RISK_THRESHOLDS: {
        HIGH_CONFIDENCE: 70,
        MEDIUM_CONFIDENCE: 40
    }
};

export const MESSAGES = {
    ERRORS: {
        MISSING_REQUIRED_KEYS: 'Please provide Serper API Key, Gemini API Key, and Brand Name.',
        VALIDATION_FAILED: 'Input validation failed',
        INVESTIGATION_FAILED: 'Investigation failed',
        PDF_GENERATION_FAILED: 'Failed to generate PDF report. Please try again.',
        NO_INVESTIGATION_DATA: 'No investigation data available to generate report.',
        API_REQUEST_FAILED: 'API request failed',
        INVALID_API_KEY: 'Invalid API Key',
        GEMINI_API_FAILED: 'Gemini API failed',
        FIRECRAWL_API_FAILED: 'Firecrawl API failed',
        FIRECRAWL_API_ERROR: 'Firecrawl API error',
        LINKEDIN_API_FAILED: 'LinkedIn API failed',
        RAPIDAPI_KEY_MISSING: 'RapidAPI key is missing for LinkedIn profile analysis'
    },

    PROGRESS: {
        PREPARING: 'Preparing investigation...',
        VALIDATING: 'Validating inputs with AI...',
        GENERATING_REPORT: 'Generating final AI analysis...',
        ANALYZING_LINKEDIN: 'Analyzing LinkedIn profiles...'
    }
};

export const SEARCH_QUERIES = {
    getCompanyNameQuery: (brandName) =>
        `"${brandName}" "private limited" OR "LLP" OR "incorporated" site:zaubacorp.com OR site:zauba.com OR "company registration"`,

    getFounderQuery: (brandName) =>
        `"${brandName}" founder OR CEO OR "founded by" OR "started by" site:zaubacorp.com OR linkedin.com OR crunchbase.com`,

    getImportQuery: (brandName) =>
        `"${brandName}" "import data" OR "import records" OR "customs data" site:zauba.com OR site:connect2india.com OR site:seair.co.in OR "HS code"`,

    getSourcingQuery: (brandName, productCategory) =>
        `"${brandName}" "${productCategory}" site:alibaba.com OR site:aliexpress.com OR site:made-in-china.com OR "OEM" OR "ODM"`
}; 