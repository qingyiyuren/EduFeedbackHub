// API configuration for different environments
// This file automatically selects the correct backend URL based on the current environment

// Get the API URL from environment variables or use default
// Fix: Ensure local development uses localhost, production uses environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Debug logging for production troubleshooting
if (typeof window !== 'undefined') {
    console.log('Environment check:', {
        hostname: window.location.hostname,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        finalAPI_URL: API_URL,
        isProduction: window.location.hostname.includes('onrender.com'),
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    });
}

// Export the API configuration
export const API_CONFIG = {
    // Base URL for all API calls
    BASE_URL: API_URL,
    
    // Full API endpoint URLs
    PROFILE: `${API_URL}/api/profile/`,
    LOGIN: `${API_URL}/api/login/`,
    REGISTER: `${API_URL}/api/register/`,
    UNIVERSITIES: `${API_URL}/api/universities/`,
    COLLEGES: `${API_URL}/api/colleges/`,
    SCHOOLS: `${API_URL}/api/schools/`,
    MODULES: `${API_URL}/api/modules/`,
    LECTURERS: `${API_URL}/api/lecturers/`,
    TEACHINGS: `${API_URL}/api/teachings/`,
    RATINGS: `${API_URL}/api/ratings/`,
    COMMENTS: `${API_URL}/api/comments/`,
    QS_RANKINGS: `${API_URL}/api/rankings/`,
    YEARS: `${API_URL}/api/years/`,
    VISIT_HISTORY: `${API_URL}/api/visit-history/`,
    NOTIFICATIONS: `${API_URL}/api/notifications/`,
    FOLLOW: `${API_URL}/api/follow/`,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_URL}/${cleanEndpoint}`;
};

// Helper function to get API URL with /api prefix
export const getApiUrlWithPrefix = (endpoint) => {
    // Remove leading /api if present
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint;
    return `${API_URL}/api/${cleanEndpoint}`;
};


