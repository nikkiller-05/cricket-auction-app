// Single source of truth for environment-derived configuration.
// Keeps env access in one place so nothing else reads process.env directly.
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
