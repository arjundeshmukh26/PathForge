/**
 * API Configuration
 * Centralizes API endpoint URLs and configuration
 */

// Get base API URL from environment or use default
const getBaseApiUrl = () => {
  // In development, try environment variable first, then fallback to localhost
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default development URLs - try multiple common development setups
  return process.env.NODE_ENV === 'production' 
    ? '/api/v1'  // Production: assume API is served from same domain
    : 'http://127.0.0.1:8000/api/v1'; // Development default
};

const BASE_API_URL = getBaseApiUrl();

// API endpoint URLs
export const API_ENDPOINTS = {
  // Analysis endpoints
  analyze: `${BASE_API_URL}/analyze`,
  updateSkills: `${BASE_API_URL}/update-skills`,
  suggestRoles: `${BASE_API_URL}/suggest-roles`,
  
  // Data endpoints  
  roles: `${BASE_API_URL}/roles`,
  
  // PDF endpoints
  extractPdfText: `${BASE_API_URL}/extract-pdf-text`,
  
  // Quiz endpoints
  getQuiz: (skill) => `${BASE_API_URL}/quiz/${encodeURIComponent(skill)}`,
  submitQuiz: `${BASE_API_URL}/quiz/submit`,
};

// Fallback URLs for development (when primary URL fails)
export const getFallbackUrls = (endpoint) => {
  const fallbackHosts = [
    'http://localhost:8000', 
    'http://127.0.0.1:8000',
    'http://localhost:8002', 
    'http://127.0.0.1:8002'
  ];
  return fallbackHosts.map(host => `${host}/api/v1${endpoint}`);
};

// API request helper with automatic fallback
export const fetchWithFallback = async (endpoint, options = {}) => {
  const urls = [endpoint, ...getFallbackUrls(endpoint.replace(BASE_API_URL, ''))];
  
  let lastError = null;
  
  for (const url of urls) {
    try {
      console.log(`Trying API request to: ${url}`);
      const response = await fetch(url, options);
      
      if (response.ok) {
        console.log(`✅ API request successful: ${url}`);
        return response;
      } else {
        console.log(`❌ API request failed (${response.status}): ${url}`);
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ API request error: ${url} - ${error.message}`);
      lastError = error;
      continue;
    }
  }
  
  throw lastError || new Error('All API endpoints failed');
};

export default API_ENDPOINTS;