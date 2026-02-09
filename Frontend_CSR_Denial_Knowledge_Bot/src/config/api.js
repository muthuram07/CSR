// API Configuration
// Prefer env-configured API URL (e.g. http://localhost:8080/api). Fallback to old default.
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

// Normalize so BASE_URL has no trailing '/api'
export const BASE_URL = RAW_API_URL.replace(/\/+$/, '').replace(/\/api$/i, '');

export const API_ENDPOINTS = {
  // Authentication endpoints
  LOGIN: `${BASE_URL}/api/auth/login`,
  REGISTER: `${BASE_URL}/api/auth/register`,
  SIGNUP: `${BASE_URL}/api/auth/register`, // Alias for signup
  
  // Smart Query endpoints (main functionality)
  SMART_QUERY: `${BASE_URL}/api/smart/query`,
  SMART_HEALTH: `${BASE_URL}/api/smart/health`,
  TRAIN_STATUS: `${BASE_URL}/api/smart/train-status`,
  AVAILABLE_DATA: `${BASE_URL}/api/smart/available-data`,

  // Chat history endpoints
  CHAT_SESSIONS: `${BASE_URL}/api/chat/sessions`,
  CHAT_TODAY_SESSION: `${BASE_URL}/api/chat/sessions/today`,
  CHAT_SESSION_MESSAGES: (sessionId) => `${BASE_URL}/api/chat/sessions/${sessionId}/messages`,
};