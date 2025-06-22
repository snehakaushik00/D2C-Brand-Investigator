/**
 * Gemini AI API Client
 * Handles all interactions with Google's Gemini AI API
 */

import { CONFIG, MESSAGES } from '../config.js';

export class GeminiAPI {
    /**
     * Generate content using Gemini AI
     * @param {string} prompt - Text prompt for AI analysis
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<Object>} AI analysis result
     */
    static async generateContent(prompt, apiKey) {
        const response = await fetch(`${CONFIG.APIS.GEMINI}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`${MESSAGES.ERRORS.GEMINI_API_FAILED}: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text;

        try {
            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No JSON found in response' };
        } catch (e) {
            return { error: 'Failed to parse AI response', raw: text };
        }
    }

    /**
     * Validate inputs using Gemini AI
     * @param {string} brandName - Brand name to validate
     * @param {string} productCategory - Product category to validate
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<Object>} Validation result
     */
    static async validateInputs(brandName, productCategory, apiKey) {
        const prompt = `
            As a business intelligence expert, validate these inputs for a D2C brand investigation:
            
            Brand Name: "${brandName}"
            Product Category: "${productCategory}"
            
            Please provide:
            1. Is this a valid brand name format?
            2. Is the product category appropriate and specific enough?
            3. Any suggested improvements or corrections
            4. Industry context and common sourcing patterns for this category
            
            Respond in JSON format:
            {
                "isValid": boolean,
                "brandNameValid": boolean,
                "categoryValid": boolean,
                "suggestions": "string",
                "industryContext": "string",
                "searchTerms": ["array", "of", "relevant", "search", "terms"]
            }
        `;

        return this.generateContent(prompt, apiKey);
    }

    /**
     * Analyze search results using Gemini AI
     * @param {Object} step - Investigation step information
     * @param {Array} searchResults - Search results to analyze
     * @param {Object|null} enhancedContent - Enhanced content from Firecrawl (optional)
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<Object>} Analysis result
     */
    static async analyzeResults(step, searchResults, enhancedContent, apiKey) {
        let enhancedContentSection = '';
        if (enhancedContent && enhancedContent.success) {
            enhancedContentSection = `
            
            ENHANCED CONTENT FROM FIRECRAWL:
            Page Title: ${enhancedContent.title}
            Page Description: ${enhancedContent.description}
            Markdown Content: ${enhancedContent.markdown?.substring(0, CONFIG.UI.MAX_FIRECRAWL_CONTENT_LENGTH) || 'N/A'}
            Key Metadata: ${JSON.stringify(enhancedContent.metadata)}
            `;
        }

        const prompt = `
            As a business intelligence expert investigating D2C brands, analyze these search results for the "${step.title}" investigation step:
            
            Search Query Used: ${step.query}
            Search Results: ${JSON.stringify(searchResults.slice(0, 5))}
            ${enhancedContentSection}
            
            Based on the search results and enhanced content, provide:
            1. Key findings relevant to determining if this is a genuine Indian manufacturer vs. import/rebrand operation
            2. Red flags that suggest import/rebranding
            3. Positive indicators of genuine manufacturing
            4. Confidence level (0-100) in your assessment
            5. Specific data points extracted (company names, import values, etc.)
            
            Focus on: ${step.description}
            
            Respond in JSON format:
            {
                "keyFindings": ["array of key findings"],
                "redFlags": ["array of red flags"],
                "positiveIndicators": ["array of positive signs"],
                "confidence": number,
                "extractedData": {
                    "companyNames": ["array"],
                    "importValues": ["array"],
                    "suppliers": ["array"],
                    "other": "relevant data"
                },
                "recommendation": "string"
            }
        `;

        return this.generateContent(prompt, apiKey);
    }

    /**
     * Generate final investigation report using Gemini AI
     * @param {Object} allFindings - All investigation findings
     * @param {string} brandName - Brand name
     * @param {string} productCategory - Product category
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<Object>} Final report
     */
    static async generateFinalReport(allFindings, brandName, productCategory, apiKey) {
        const prompt = `
            As a business intelligence expert, create a comprehensive investigation report for the D2C brand "${brandName}" in the "${productCategory}" category.
            
            Investigation Findings: ${JSON.stringify(allFindings)}
            
            Provide a final assessment including:
            1. Overall risk assessment (Low/Medium/High) with reasoning
            2. Likelihood this is a genuine Indian manufacturer vs. import operation (0-100%)
            3. Key evidence supporting your conclusion
            4. Most concerning red flags
            5. Actionable recommendations for consumers/investors
            6. Areas needing further investigation
            
            Respond in JSON format:
            {
                "overallRisk": "Low/Medium/High",
                "manufacturingLikelihood": number,
                "reasoning": "detailed explanation",
                "keyEvidence": ["array of evidence"],
                "majorRedFlags": ["array of concerning issues"],
                "recommendations": ["array of actionable recommendations"],
                "furtherInvestigation": ["array of areas to investigate further"],
                "summary": "brief executive summary"
            }
        `;

        return this.generateContent(prompt, apiKey);
    }

    /**
     * Validate Gemini API key format
     * @param {string} apiKey - API key to validate
     * @returns {boolean} True if format appears valid
     */
    static validateApiKey(apiKey) {
        return typeof apiKey === 'string' && apiKey.trim().length > 30; // Gemini keys are typically longer
    }

    /**
     * Analyze LinkedIn profiles to assess team composition and capabilities
     * @param {Array} linkedinProfiles - Array of LinkedIn profile data
     * @param {string} brandName - Brand name being investigated
     * @param {string} productCategory - Product category
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<Object>} AI analysis of LinkedIn profiles
     */
    static async analyzeLinkedInProfiles(linkedinProfiles, brandName, productCategory, apiKey) {
        try {
            const profilesText = linkedinProfiles.map(profile => {
                const p = profile.profile;
                return `
Name: ${p.fullName}
Headline: ${p.headline}
Current Company: ${p.currentCompany}
Current Position: ${p.currentPosition}
Location: ${p.location}
Summary: ${p.summary}
Experience: ${p.experience.map(exp => `${exp.title} at ${exp.company} (${exp.duration})`).join(', ')}
Education: ${p.education.map(edu => `${edu.degree} from ${edu.school}`).join(', ')}
Skills: ${p.skills.join(', ')}
                `.trim();
            }).join('\n\n---\n\n');

            const prompt = `
You are analyzing LinkedIn profiles of team members from ${brandName}, a D2C brand in the ${productCategory} category.

LinkedIn Profiles:
${profilesText}

Please analyze these profiles and provide insights about:

1. Team Composition Analysis:
   - What types of roles are present in the team?
   - Is this primarily a marketing/sales team or does it include technical/engineering roles?
   - What is the overall team structure and expertise?

2. Manufacturing Capability Assessment:
   - Does the team have members with manufacturing, engineering, or R&D experience?
   - Are there any technical roles that would indicate in-house manufacturing capabilities?
   - What does the team composition suggest about their manufacturing approach?

3. Red Flags for Import Operations:
   - Are there signs this is primarily a marketing company?
   - Lack of technical/engineering roles?
   - Heavy focus on sales/marketing without manufacturing expertise?

4. Positive Indicators for Manufacturing:
   - Presence of engineers, product designers, or manufacturing specialists?
   - Technical backgrounds in relevant fields?
   - R&D or product development experience?

5. Overall Assessment:
   - Confidence level (0-100%) in your analysis
   - Key findings about team capabilities
   - Recommendations for further investigation

Please provide your analysis in this JSON format:
{
    "confidence": 85,
    "teamComposition": "Marketing-heavy team with limited technical roles",
    "manufacturingCapability": "Low - No evidence of manufacturing expertise",
    "redFlags": ["No engineers on team", "Primarily marketing/sales backgrounds"],
    "positiveIndicators": [],
    "keyFindings": ["Team consists mainly of marketing and business development roles"],
    "recommendation": "Team composition suggests this is likely an import operation rather than a manufacturing company"
}
            `;

            const response = await this.generateContent(prompt, apiKey);
            
            // Handle case where response might not be valid JSON
            if (typeof response === 'object' && response !== null) {
                return response;
            } else if (typeof response === 'string') {
                try {
                    return JSON.parse(response);
                } catch (parseError) {
                    console.warn('Failed to parse LinkedIn analysis response:', parseError);
                    return {
                        confidence: 0,
                        teamComposition: 'Analysis completed but parsing failed',
                        manufacturingCapability: 'Unable to assess',
                        redFlags: [],
                        positiveIndicators: [],
                        keyFindings: ['LinkedIn profile analysis completed but results could not be parsed'],
                        recommendation: 'Manual review of team composition recommended'
                    };
                }
            }
            
            return response;
        } catch (error) {
            console.error('LinkedIn profile analysis failed:', error);
            return {
                confidence: 0,
                teamComposition: 'Analysis failed',
                manufacturingCapability: 'Unable to assess',
                redFlags: [],
                positiveIndicators: [],
                keyFindings: ['LinkedIn profile analysis could not be completed'],
                recommendation: 'Manual review of team composition recommended'
            };
        }
    }
} 