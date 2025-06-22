/**
 * LinkedIn API Client
 * Handles LinkedIn profile data fetching using RapidAPI
 */

import { CONFIG, MESSAGES } from '../config.js';

export class LinkedInAPI {
    /**
     * Fetch LinkedIn profile data using RapidAPI
     * @param {string} linkedinUrl - LinkedIn profile URL
     * @param {string} apiKey - RapidAPI key
     * @returns {Promise<Object>} LinkedIn profile data
     */
    static async getProfileData(linkedinUrl, apiKey) {
        try {
            const encodedUrl = encodeURIComponent(linkedinUrl);
            const url = `https://fresh-linkedin-profile-data.p.rapidapi.com/get-linkedin-profile?linkedin_url=${encodedUrl}&include_skills=false&include_certifications=false&include_publications=false&include_honors=false&include_volunteers=false&include_projects=false&include_patents=false&include_courses=false&include_organizations=false&include_profile_status=false&include_company_public_url=false`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com',
                    'x-rapidapi-key': apiKey
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid RapidAPI Key');
                } else if (response.status === 403) {
                    throw new Error('LinkedIn profile access denied');
                } else if (response.status === 404) {
                    throw new Error('LinkedIn profile not found');
                }
                throw new Error(`LinkedIn API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return this.processProfileData(data);
        } catch (error) {
            console.error('LinkedIn API error:', error);
            throw new Error(`LinkedIn API failed: ${error.message}`);
        }
    }

    /**
     * Process and structure LinkedIn profile data
     * @param {Object} rawData - Raw API response
     * @returns {Object} Processed profile data
     */
    static processProfileData(rawData) {
        console.log('Raw LinkedIn API response:', rawData); // Debug log
        
        if (!rawData || rawData.error) {
            throw new Error(rawData?.error || 'Invalid LinkedIn profile data');
        }

        // Try to extract data from various possible response structures
        let profileData = rawData;
        
        // If response has a data property, use that
        if (rawData.data) {
            profileData = rawData.data;
        }
        
        // If response has a result property, use that
        if (rawData.result) {
            profileData = rawData.result;
        }

        // Handle different possible field names for each property
        const profile = {
            fullName: this.extractField(profileData, ['full_name', 'name', 'fullName', 'displayName', 'full_name_clean']),
            headline: this.extractField(profileData, ['headline', 'title', 'job_title', 'current_title', 'headline_clean']),
            location: this.extractField(profileData, ['location', 'geoLocation', 'location_name', 'location_clean']),
            summary: this.extractField(profileData, ['summary', 'about', 'description', 'bio', 'summary_clean']),
            currentCompany: this.extractField(profileData, ['current_company', 'company', 'employer', 'current_company_name']),
            currentPosition: this.extractField(profileData, ['current_position', 'job_title', 'title', 'current_job_title']),
            experience: this.extractField(profileData, ['experience', 'work_experience', 'employment_history', 'jobs'], []),
            education: this.extractField(profileData, ['education', 'educational_background', 'academic_history'], []),
            skills: this.extractField(profileData, ['skills', 'skill_list', 'expertise'], []),
            profileUrl: this.extractField(profileData, ['profile_url', 'url', 'linkedin_url', 'public_profile_url'])
        };

        // Clean up empty arrays and null values
        Object.keys(profile).forEach(key => {
            if (profile[key] === null || profile[key] === undefined) {
                profile[key] = 'N/A';
            }
            if (Array.isArray(profile[key]) && profile[key].length === 0) {
                profile[key] = [];
            }
        });

        console.log('Processed LinkedIn profile:', profile); // Debug log

        return {
            success: true,
            profile: profile,
            metadata: {
                fetchedAt: new Date().toISOString(),
                source: 'RapidAPI LinkedIn Profile Data'
            }
        };
    }

    /**
     * Extract field value from object using multiple possible field names
     * @param {Object} obj - Object to search in
     * @param {Array} fieldNames - Array of possible field names
     * @param {*} defaultValue - Default value if field not found
     * @returns {*} Field value or default value
     */
    static extractField(obj, fieldNames, defaultValue = 'N/A') {
        for (const fieldName of fieldNames) {
            if (obj && obj[fieldName] !== undefined && obj[fieldName] !== null) {
                return obj[fieldName];
            }
        }
        return defaultValue;
    }

    /**
     * Extract LinkedIn URLs from search results
     * @param {Array} searchResults - Search results from Serper
     * @returns {Array} Array of LinkedIn URLs
     */
    static extractLinkedInUrls(searchResults) {
        if (!searchResults || !Array.isArray(searchResults)) {
            return [];
        }

        const linkedinUrls = [];
        searchResults.forEach(result => {
            if (result.link && result.link.includes('linkedin.com/in/')) {
                linkedinUrls.push(result.link);
            }
        });

        return linkedinUrls;
    }

    /**
     * Validate RapidAPI key format
     * @param {string} apiKey - API key to validate
     * @returns {boolean} True if format appears valid
     */
    static validateApiKey(apiKey) {
        return typeof apiKey === 'string' && apiKey.trim().length > 0 && apiKey.includes('rapidapi');
    }
} 