// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export const API_BASE = `${BACKEND_URL}/api`;

export const API_ENDPOINTS = {
  EVENTS: `${API_BASE}/events`,
  REGISTRATIONS: `${API_BASE}/registrations`,
  REGISTRATIONS_BATCH: `${API_BASE}/registrations/batch`,
  CONTACT: `${API_BASE}/contact`,
  STATS: `${API_BASE}/stats`,
  STATUS: `${API_BASE}/status`,
};
