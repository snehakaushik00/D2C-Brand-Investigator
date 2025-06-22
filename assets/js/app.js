/**
 * D2C Brand Investigator - Main Application Entry Point
 * 
 * This is the main application file that coordinates all modules and handles
 * the investigation workflow using a modular architecture.
 */

// Core imports
import { CONFIG, MESSAGES } from './config.js';
import { StorageManager } from './utils/storage.js';
import { DOMManager } from './ui/dom-manager.js';

// API clients
import { SerperAPI } from './api/serper.js';
import { GeminiAPI } from './api/gemini.js';
import { FirecrawlAPI } from './api/firecrawl.js';
import { LinkedInAPI } from './api/linkedin.js';

// Investigation modules
import { InvestigationSteps } from './investigation/steps.js';

class D2CBrandInvestigator {
    constructor() {
        this.domManager = new DOMManager();
        this.investigationData = {};
        this.currentStep = 0;
        this.totalSteps = CONFIG.INVESTIGATION_STEPS.TOTAL_STEPS + 1; // +1 for LinkedIn analysis

        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        this.loadStoredApiKeys();
        this.setupEventListeners();
    }

    /**
     * Load API keys from localStorage
     */
    loadStoredApiKeys() {
        const storedKeys = StorageManager.loadAllApiKeys();
        this.domManager.setApiKeys(storedKeys);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.domManager.elements.investigateBtn.addEventListener('click', () => {
            this.handleInvestigation();
        });

        this.domManager.elements.downloadReportBtn.addEventListener('click', () => {
            this.generatePDFReport();
        });
    }

    /**
     * Update progress indicator
     * @param {number} step - Current step number
     * @param {string} text - Progress text to display
     */
    updateProgress(step, text) {
        this.currentStep = step;
        const percent = Math.round((this.currentStep / this.totalSteps) * 100);

        this.domManager.elements.progressText.textContent = text;
        this.domManager.elements.progressPercent.textContent = `${percent}%`;
        this.domManager.elements.progressBar.style.width = `${percent}%`;
    }

    /**
     * Main investigation handler
     */
    async handleInvestigation() {
        const apiKeys = this.domManager.getApiKeys();
        const { brandName, productCategory } = this.domManager.getInvestigationInputs();

        // Validate required inputs
        if (!StorageManager.hasRequiredKeys(apiKeys) || !brandName) {
            this.domManager.showStatus(MESSAGES.ERRORS.MISSING_REQUIRED_KEYS, 'error');
            return;
        }

        // Save API keys
        StorageManager.saveAllApiKeys(apiKeys);

        // Reset UI and start investigation
        this.domManager.setInvestigateButtonState(false);
        this.domManager.resetForNewInvestigation();

        this.investigationData = {
            brandName,
            productCategory,
            findings: {},
            aiAnalysis: {}
        };

        try {
            // Step 1: Validate inputs with AI
            this.updateProgress(1, MESSAGES.PROGRESS.VALIDATING);
            const validation = await GeminiAPI.validateInputs(brandName, productCategory, apiKeys.gemini);

            if (!validation.isValid) {
                throw new Error(`${MESSAGES.ERRORS.VALIDATION_FAILED}: ${validation.suggestions}`);
            }

            this.investigationData.validation = validation;

            // Steps 2-5: Investigation steps
            const investigationSteps = InvestigationSteps.getSteps(brandName, productCategory);

            for (let i = 0; i < investigationSteps.length; i++) {
                const step = investigationSteps[i];
                this.updateProgress(i + 2, `Investigating ${step.title}...`);

                // Get search results
                const searchResults = await SerperAPI.search(step.query, apiKeys.serper);

                // Enhance with Firecrawl if available and URL is suitable
                if (apiKeys.firecrawl && searchResults.organic && searchResults.organic.length > 0) {
                    const topUrl = searchResults.organic[0].link;
                    if (FirecrawlAPI.isScrapeableUrl(topUrl)) {
                        const crawlData = await FirecrawlAPI.safeScrapeContent(topUrl, apiKeys.firecrawl);
                        if (crawlData) {
                            searchResults.enhancedContent = crawlData;
                        }
                    }
                }

                // AI analysis of results
                const aiAnalysis = await GeminiAPI.analyzeResults(
                    step,
                    searchResults.organic || [],
                    searchResults.enhancedContent || null,
                    apiKeys.gemini
                );

                this.investigationData.findings[step.step] = {
                    searchResults: searchResults,
                    aiAnalysis: aiAnalysis
                };
            }

            // Step 6: LinkedIn Profile Analysis (if RapidAPI key is available)
            if (apiKeys.rapidapi) {
                this.updateProgress(6, MESSAGES.PROGRESS.ANALYZING_LINKEDIN);
                
                // Collect all LinkedIn URLs from previous search results
                const allLinkedInUrls = [];
                Object.values(this.investigationData.findings).forEach(stepData => {
                    if (stepData.searchResults && stepData.searchResults.organic) {
                        const linkedinUrls = LinkedInAPI.extractLinkedInUrls(stepData.searchResults.organic);
                        console.log('LinkedIn URLs found in step:', linkedinUrls); // Debug log
                        allLinkedInUrls.push(...linkedinUrls);
                    }
                });

                console.log('All LinkedIn URLs collected:', allLinkedInUrls); // Debug log

                // Remove duplicates and limit to max profiles
                const uniqueLinkedInUrls = [...new Set(allLinkedInUrls)].slice(0, CONFIG.UI.MAX_LINKEDIN_PROFILES);
                console.log('Unique LinkedIn URLs to process:', uniqueLinkedInUrls); // Debug log

                if (uniqueLinkedInUrls.length > 0) {
                    const linkedinProfiles = [];
                    
                    for (const linkedinUrl of uniqueLinkedInUrls) {
                        try {
                            console.log('Fetching LinkedIn profile for:', linkedinUrl); // Debug log
                            const profileData = await LinkedInAPI.getProfileData(linkedinUrl, apiKeys.rapidapi);
                            linkedinProfiles.push(profileData);
                        } catch (error) {
                            console.warn(`Failed to fetch LinkedIn profile ${linkedinUrl}:`, error.message);
                        }
                    }

                    console.log('LinkedIn profiles fetched:', linkedinProfiles); // Debug log

                    if (linkedinProfiles.length > 0) {
                        // AI analysis of LinkedIn profiles
                        const linkedinAnalysis = await GeminiAPI.analyzeLinkedInProfiles(
                            linkedinProfiles,
                            brandName,
                            productCategory,
                            apiKeys.gemini
                        );

                        this.investigationData.findings.linkedinProfiles = {
                            profiles: linkedinProfiles,
                            aiAnalysis: linkedinAnalysis
                        };
                    }
                } else {
                    console.log('No LinkedIn URLs found in search results'); // Debug log
                }
            }

            // Step 7: Generate final AI report
            this.updateProgress(7, MESSAGES.PROGRESS.GENERATING_REPORT);
            const finalReport = await GeminiAPI.generateFinalReport(
                this.investigationData.findings,
                brandName,
                productCategory,
                apiKeys.gemini
            );
            this.investigationData.finalReport = finalReport;

            // Display results
            this.displayResults();

        } catch (error) {
            console.error('Investigation failed:', error);
            this.domManager.elements.progressSection.classList.add('hidden');
            this.domManager.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.domManager.setInvestigateButtonState(true);
        }
    }

    /**
     * Display investigation results
     */
    displayResults() {
        this.domManager.showResults();
        this.domManager.clearResults();

        // Display validation insights
        if (this.investigationData.validation) {
            this.displayValidationCard(this.investigationData.validation);
        }

        // Display each investigation step, excluding the special LinkedIn step
        Object.entries(this.investigationData.findings).forEach(([stepKey, stepData]) => {
            if (stepKey !== 'linkedinProfiles') {
                this.displayResultCard(stepKey, stepData);
            }
        });

        // Display LinkedIn profile analysis results in its own dedicated card
        if (this.investigationData.findings.linkedinProfiles) {
            this.displayLinkedInResults(this.investigationData.findings.linkedinProfiles);
        }

        // Generate AI summary
        this.generateAISummary();
    }

    /**
     * Display validation results card
     * @param {Object} validation - Validation results
     */
    displayValidationCard(validation) {
        const card = document.createElement('div');
        card.className = 'result-card bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4';

        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="text-md font-semibold text-slate-700 flex items-center gap-2">
                        🤖 AI Input Validation
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">AI-powered input validation and optimization</p>
                </div>
            </div>
            <div class="ai-analysis p-3 rounded-md mt-3 text-sm">
                <div class="mb-2"><strong class="text-purple-700">✅ Validation Status:</strong> ${validation.isValid ? 'Passed' : 'Failed'}</div>
                ${validation.suggestions ? `<div class="mb-2"><strong class="text-purple-700">💡 Suggestions:</strong><br/>${validation.suggestions}</div>` : ''}
                ${validation.industryContext ? `<div class="mb-2"><strong class="text-purple-700">🏭 Industry Context:</strong><br/>${validation.industryContext}</div>` : ''}
                ${validation.searchTerms ? `<div class="text-xs text-purple-600 mt-2">Enhanced search terms: ${validation.searchTerms.join(', ')}</div>` : ''}
            </div>
        `;

        this.domManager.elements.results.appendChild(card);
    }

    /**
     * Display result card for investigation step
     * @param {string} stepKey - Step identifier
     * @param {Object} stepData - Step data including search results and AI analysis
     */
    displayResultCard(stepKey, stepData) {
        const card = document.createElement('div');
        const aiAnalysis = stepData.aiAnalysis;

        // Determine card styling based on AI analysis
        let cardClass = 'result-card bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4';
        if (aiAnalysis.redFlags && aiAnalysis.redFlags.length > 0) {
            cardClass = 'result-card bg-red-50 border border-red-200 rounded-lg p-4 mb-4';
        } else if (aiAnalysis.confidence > CONFIG.RISK_THRESHOLDS.HIGH_CONFIDENCE) {
            cardClass = 'result-card bg-green-50 border border-green-200 rounded-lg p-4 mb-4';
        }

        card.className = cardClass;

        // Enhanced content section
        let enhancedContentHtml = '';
        if (stepData.searchResults && stepData.searchResults.enhancedContent && stepData.searchResults.enhancedContent.success) {
            const content = stepData.searchResults.enhancedContent;
            enhancedContentHtml = `
                <div class="enhanced-content p-3 bg-blue-50 border border-blue-200 rounded-md mb-3 text-sm">
                    <div class="mb-2"><strong class="text-blue-700">🕷️ Enhanced Content Analysis</strong></div>
                    <div class="text-xs mb-1"><strong>Page:</strong> ${content.title}</div>
                    ${content.description ? `<div class="text-xs mb-1"><strong>Description:</strong> ${content.description}</div>` : ''}
                    <div class="text-xs text-blue-600">✅ Deep content parsing enabled via Firecrawl v1 API</div>
                </div>
            `;
        }

        // AI insights section
        let aiInsightsHtml = '';
        if (aiAnalysis) {
            aiInsightsHtml = this.generateAIInsightsHTML(aiAnalysis);
        }

        // Search results section
        let resultsHtml = '<p class="text-sm text-slate-500">No results found.</p>';
        if (stepData.searchResults && stepData.searchResults.organic && stepData.searchResults.organic.length > 0) {
            resultsHtml = '<ul class="space-y-3 mt-3">';
            stepData.searchResults.organic.slice(0, CONFIG.UI.MAX_SEARCH_RESULTS_DISPLAY).forEach(item => {
                resultsHtml += `
                    <li class="text-sm">
                        <a href="${item.link}" target="_blank" class="font-medium text-indigo-700 hover:underline">${item.title}</a>
                        <p class="text-slate-600">${item.snippet || ''}</p>
                    </li>
                `;
            });
            resultsHtml += '</ul>';
        }

        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="text-md font-semibold text-slate-700">${CONFIG.STEP_TITLES[stepKey] || stepKey}</h3>
                    <p class="text-xs text-slate-500 mt-1">AI-enhanced investigation with intelligent analysis</p>
                </div>
            </div>
            ${enhancedContentHtml}
            ${aiInsightsHtml}
            ${resultsHtml}
        `;

        this.domManager.elements.results.appendChild(card);
    }

    /**
     * Display LinkedIn profile analysis results
     * @param {Object} linkedinData - LinkedIn profiles and analysis data
     */
    displayLinkedInResults(linkedinData) {
        if (!linkedinData || !linkedinData.profiles || linkedinData.profiles.length === 0) {
            return;
        }

        const card = document.createElement('div');
        card.className = 'result-card bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4';

        let profilesHtml = '';
        linkedinData.profiles.forEach((profile, index) => {
            const profileUrl = profile.profile.profileUrl;
            profilesHtml += `
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="block mb-4 p-3 bg-white rounded-md hover:bg-blue-100 transition-colors duration-200">
                    <h4 class="font-semibold text-blue-800">${profile.profile.fullName}</h4>
                    <p class="text-sm text-blue-600">${profile.profile.headline}</p>
                    <p class="text-xs text-blue-500">${profile.profile.currentCompany} • ${profile.profile.location}</p>
                    ${profile.profile.summary ? `<p class="text-xs text-blue-700 mt-2">${profile.profile.summary.substring(0, 200)}...</p>` : ''}
                </a>
            `;
        });

        let aiInsightsHtml = '';
        if (linkedinData.aiAnalysis) {
            aiInsightsHtml = this.generateAIInsightsHTML(linkedinData.aiAnalysis);
        }

        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="text-md font-semibold text-slate-700 flex items-center gap-2">
                        👥 LinkedIn Profile Analysis
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Team composition and capabilities analysis</p>
                </div>
            </div>
            ${aiInsightsHtml}
            <div class="mt-3">
                <h4 class="text-sm font-medium text-blue-800 mb-2">Profiles Analyzed (${linkedinData.profiles.length}):</h4>
                ${profilesHtml}
            </div>
        `;

        this.domManager.elements.results.appendChild(card);
    }

    /**
     * Generate AI insights HTML
     * @param {Object} aiAnalysis - AI analysis data
     * @returns {string} HTML string for AI insights
     */
    generateAIInsightsHTML(aiAnalysis) {
        return `
            <div class="ai-analysis p-3 rounded-md mb-3 text-sm">
                <div class="mb-2"><strong class="text-purple-700">🤖 AI Analysis (Confidence: ${aiAnalysis.confidence}%)</strong></div>
                
                ${aiAnalysis.keyFindings && aiAnalysis.keyFindings.length > 0 ? `
                <div class="mb-2">
                    <strong class="text-blue-700">🔍 Key Findings:</strong>
                    ${aiAnalysis.keyFindings.map(finding => `<div class="text-blue-600 text-xs mb-1">• ${finding}</div>`).join('')}
                </div>
                ` : ''}
                
                ${aiAnalysis.redFlags && aiAnalysis.redFlags.length > 0 ? `
                <div class="mb-2">
                    <strong class="text-red-700">⚠️ Red Flags:</strong>
                    ${aiAnalysis.redFlags.map(flag => `<div class="text-red-600 text-xs mb-1">• ${flag}</div>`).join('')}
                </div>
                ` : ''}
                
                ${aiAnalysis.positiveIndicators && aiAnalysis.positiveIndicators.length > 0 ? `
                <div class="mb-2">
                    <strong class="text-green-700">✅ Positive Indicators:</strong>
                    ${aiAnalysis.positiveIndicators.map(indicator => `<div class="text-green-600 text-xs mb-1">• ${indicator}</div>`).join('')}
                </div>
                ` : ''}
                
                ${aiAnalysis.recommendation ? `
                <div class="text-xs text-purple-600 mt-2 font-medium">💡 ${aiAnalysis.recommendation}</div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Generate AI summary
     */
    generateAISummary() {
        if (this.investigationData.finalReport) {
            this.domManager.elements.aiSummaryContent.innerHTML = `
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Overall Risk Assessment:</span>
                        <span class="font-bold ${this.getRiskColor(this.investigationData.finalReport.overallRisk)}">${this.investigationData.finalReport.overallRisk}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Manufacturing Likelihood:</span>
                        <span class="font-bold">${this.investigationData.finalReport.manufacturingLikelihood}%</span>
                    </div>
                    <div class="text-sm">
                        <strong>Executive Summary:</strong>
                        <p class="mt-1">${this.investigationData.finalReport.summary}</p>
                    </div>
                    ${this.investigationData.finalReport.recommendations && this.investigationData.finalReport.recommendations.length > 0 ? `
                    <div class="text-sm">
                        <strong>Key Recommendations:</strong>
                        <ul class="mt-1 ml-4 space-y-1">
                            ${this.investigationData.finalReport.recommendations.map(rec => `<li class="text-xs">• ${rec}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    }

    /**
     * Get CSS color class for risk level
     * @param {string} risk - Risk level (High/Medium/Low)
     * @returns {string} CSS color class
     */
    getRiskColor(risk) {
        switch (risk) {
            case 'High': return 'text-red-600';
            case 'Medium': return 'text-yellow-600';
            case 'Low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    }

    /**
     * Generate PDF report and trigger download using PDFMake
     */
    generatePDFReport() {
        if (!this.investigationData.finalReport) {
            alert(MESSAGES.ERRORS.NO_INVESTIGATION_DATA);
            return;
        }

        const currentDate = new Date().toLocaleDateString();
        const brandName = this.investigationData.brandName || 'Unknown Brand';
        const productCategory = this.investigationData.productCategory || 'Unknown Category';

        // Helper function to create step content
        function createStepContent(stepKey, stepData) {
            const stepTitles = CONFIG.STEP_TITLES || {
                companyName: 'Registered Company Name',
                founders: 'Founder Information',
                imports: 'Import Records',
                sourcing: 'Product Sourcing'
            };

            const content = [
                { text: stepTitles[stepKey] || stepKey, style: 'stepHeader' },
            ];

            // Add AI Analysis
            if (stepData.aiAnalysis) {
                const ai = stepData.aiAnalysis;
                content.push(
                    { text: `AI Confidence: ${ai.confidence}%`, style: 'confidenceScore' },
                    { text: '\n' }
                );

                if (ai.keyFindings && ai.keyFindings.length > 0) {
                    content.push(
                        { text: 'Key Findings:', style: 'subheader' },
                        {
                            ul: ai.keyFindings.map(finding => finding),
                            style: 'findings'
                        }
                    );
                }

                if (ai.redFlags && ai.redFlags.length > 0) {
                    content.push(
                        { text: 'Red Flags:', style: 'redFlags' },
                        {
                            ul: ai.redFlags.map(flag => flag),
                            style: 'findings'
                        }
                    );
                }

                if (ai.positiveIndicators && ai.positiveIndicators.length > 0) {
                    content.push(
                        { text: 'Positive Indicators:', style: 'positiveIndicators' },
                        {
                            ul: ai.positiveIndicators.map(indicator => indicator),
                            style: 'findings'
                        }
                    );
                }

                if (ai.recommendation) {
                    content.push(
                        { text: 'Recommendation:', style: 'subheader' },
                        { text: ai.recommendation, style: 'recommendation' }
                    );
                }
            }

            // Add enhanced content info if available
            if (stepData.searchResults && stepData.searchResults.enhancedContent && stepData.searchResults.enhancedContent.success) {
                content.push(
                    { text: '\nEnhanced Content Analysis:', style: 'subheader' },
                    { text: `✅ Deep content parsing enabled via Firecrawl API`, style: 'enhancedNote' },
                    { text: `Page: ${stepData.searchResults.enhancedContent.title}`, style: 'pageInfo' }
                );
            }

            content.push({ text: '\n', pageBreak: 'after' });
            return content;
        }

        // PDF Document Definition
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],

            header: {
                text: 'D2C Brand Investigation Report',
                style: 'pageHeader',
                margin: [40, 20, 40, 20]
            },

            footer: function (currentPage, pageCount) {
                return {
                    text: `Generated by AI-Enhanced D2C Brand Investigator | Page ${currentPage} of ${pageCount}`,
                    style: 'pageFooter',
                    margin: [40, 20, 40, 20]
                };
            },

            content: [
                // Title Section
                { text: 'D2C BRAND INVESTIGATION REPORT', style: 'title' },
                { text: `Generated on ${currentDate}`, style: 'dateGenerated' },
                { text: '\n' },

                // Executive Summary
                { text: 'EXECUTIVE SUMMARY', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            ['Brand Name:', brandName],
                            ['Product Category:', productCategory],
                            ['Overall Risk:', { text: this.investigationData.finalReport.overallRisk, style: this.investigationData.finalReport.overallRisk === 'High' ? 'highRisk' : this.investigationData.finalReport.overallRisk === 'Medium' ? 'mediumRisk' : 'lowRisk' }],
                            ['Manufacturing Likelihood:', `${this.investigationData.finalReport.manufacturingLikelihood}%`],
                            ['Investigation Date:', currentDate]
                        ]
                    },
                    style: 'summaryTable'
                },
                { text: '\n' },

                // Summary Text
                { text: 'Summary:', style: 'subheader' },
                { text: this.investigationData.finalReport.summary || 'No summary available.', style: 'summaryText' },
                { text: '\n' },

                // Key Evidence
                ...(this.investigationData.finalReport.keyEvidence && this.investigationData.finalReport.keyEvidence.length > 0 ? [
                    { text: 'Key Evidence:', style: 'subheader' },
                    {
                        ul: this.investigationData.finalReport.keyEvidence,
                        style: 'findings'
                    },
                    { text: '\n' }
                ] : []),

                // Major Red Flags
                ...(this.investigationData.finalReport.majorRedFlags && this.investigationData.finalReport.majorRedFlags.length > 0 ? [
                    { text: 'Major Red Flags:', style: 'redFlags' },
                    {
                        ul: this.investigationData.finalReport.majorRedFlags,
                        style: 'findings'
                    },
                    { text: '\n' }
                ] : []),

                // Recommendations
                ...(this.investigationData.finalReport.recommendations && this.investigationData.finalReport.recommendations.length > 0 ? [
                    { text: 'Recommendations:', style: 'subheader' },
                    {
                        ol: this.investigationData.finalReport.recommendations,
                        style: 'findings'
                    },
                    { text: '\n' }
                ] : []),

                { text: 'DETAILED INVESTIGATION FINDINGS', style: 'sectionHeader', pageBreak: 'before' },

                // Investigation Steps
                ...Object.entries(this.investigationData.findings).map(([stepKey, stepData]) =>
                    createStepContent(stepKey, stepData)
                ).flat(),

                // Disclaimer Section
                { text: 'IMPORTANT DISCLAIMER', style: 'sectionHeader', pageBreak: 'before' },
                { text: 'Analysis Limitations:', style: 'subheader' },
                {
                    ul: [
                        'This investigation relies on publicly available digital information, which may be limited or incomplete for many organizations.',
                        'Missing Data: Many companies have minimal online presence or corporate records.',
                        'Outdated Information: Import records, registrations may not reflect current operations.',
                        'Regional Variations: Some data sources are region-specific and may miss information.',
                        'AI Limitations: Analysis is based on available data and may not capture full context.'
                    ],
                    style: 'disclaimerList'
                },
                { text: '\n' },
                { text: 'Always conduct additional due diligence and verify findings through multiple sources before making business decisions.', style: 'disclaimerWarning' }
            ],

            styles: {
                title: {
                    fontSize: 20,
                    bold: true,
                    alignment: 'center',
                    color: '#1e40af'
                },
                dateGenerated: {
                    fontSize: 10,
                    alignment: 'center',
                    color: '#6b7280'
                },
                sectionHeader: {
                    fontSize: 16,
                    bold: true,
                    color: '#1f2937',
                    margin: [0, 20, 0, 10]
                },
                stepHeader: {
                    fontSize: 14,
                    bold: true,
                    color: '#374151',
                    margin: [0, 15, 0, 5]
                },
                subheader: {
                    fontSize: 12,
                    bold: true,
                    color: '#4b5563',
                    margin: [0, 10, 0, 5]
                },
                confidenceScore: {
                    fontSize: 10,
                    italics: true,
                    color: '#8b5cf6'
                },
                redFlags: {
                    fontSize: 12,
                    bold: true,
                    color: '#dc2626'
                },
                positiveIndicators: {
                    fontSize: 12,
                    bold: true,
                    color: '#059669'
                },
                findings: {
                    fontSize: 10,
                    margin: [0, 2, 0, 8]
                },
                recommendation: {
                    fontSize: 10,
                    italics: true,
                    color: '#7c3aed'
                },
                enhancedNote: {
                    fontSize: 9,
                    color: '#2563eb',
                    italics: true
                },
                pageInfo: {
                    fontSize: 9,
                    color: '#6b7280'
                },
                summaryTable: {
                    fontSize: 11,
                    margin: [0, 5, 0, 5]
                },
                summaryText: {
                    fontSize: 11,
                    margin: [0, 5, 0, 5]
                },
                disclaimerList: {
                    fontSize: 10,
                    margin: [0, 5, 0, 5]
                },
                disclaimerWarning: {
                    fontSize: 11,
                    bold: true,
                    color: '#dc2626',
                    margin: [0, 10, 0, 5]
                },
                pageHeader: {
                    fontSize: 12,
                    bold: true,
                    alignment: 'center',
                    color: '#4b5563'
                },
                pageFooter: {
                    fontSize: 8,
                    alignment: 'center',
                    color: '#9ca3af'
                },
                highRisk: {
                    color: '#dc2626',
                    bold: true
                },
                mediumRisk: {
                    color: '#d97706',
                    bold: true
                },
                lowRisk: {
                    color: '#059669',
                    bold: true
                }
            }
        };

        // Generate and download PDF
        try {
            const fileName = `${brandName.replace(/[^a-z0-9]/gi, '_')}_Investigation_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdfMake.createPdf(docDefinition).download(fileName);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new D2CBrandInvestigator();
});

export default D2CBrandInvestigator; 