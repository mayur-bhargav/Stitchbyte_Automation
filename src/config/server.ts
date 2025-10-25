/**
 * Server URI Configuration
 * Central configuration file for backend API endpoint
 * 
 * Usage:
 * import { SERVER_URI } from '@/config/server';
 * 
 * Then use: `${SERVER_URI}/your-endpoint`
 */

// Get the server URI from environment variable or use default
export const SERVER_URI = 'https://automationwhats.stitchbyte.in';

// Export as default for convenience
export default SERVER_URI;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${SERVER_URI}/${cleanEndpoint}`;
};

// Common API endpoints (optional - for convenience)
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${SERVER_URI}/auth/login`,
    SIGNUP: `${SERVER_URI}/auth/signup`,
    LOGOUT: `${SERVER_URI}/auth/logout`,
  },
  
  // Chat
  CHAT: {
    CONTACTS: `${SERVER_URI}/chat/contacts`,
    MESSAGES: (phone: string) => `${SERVER_URI}/chat/messages/${encodeURIComponent(phone)}`,
    CONTACT: (phone: string) => `${SERVER_URI}/chat/contact/${encodeURIComponent(phone)}`,
    SEND_TEXT: `${SERVER_URI}/chat/send-text`,
    SEND_MEDIA: `${SERVER_URI}/chat/send-media`,
  },
  
  // Campaigns
  CAMPAIGNS: {
    LIST: `${SERVER_URI}/campaigns`,
    DETAIL: (id: string) => `${SERVER_URI}/campaigns/${id}`,
    START: (id: string) => `${SERVER_URI}/campaigns/${id}/start`,
    STOP: (id: string) => `${SERVER_URI}/campaigns/${id}/stop`,
    STATUS: (id: string) => `${SERVER_URI}/campaigns/${id}/status`,
  },
  
  // Broadcasts
  BROADCASTS: {
    LIST: `${SERVER_URI}/broadcasts`,
    DETAIL: (id: string) => `${SERVER_URI}/broadcasts/${id}`,
    SEND: (id: string) => `${SERVER_URI}/broadcasts/${id}/send`,
  },
  
  // Templates
  TEMPLATES: {
    SUBMIT: `${SERVER_URI}/submit-template-with-file`,
  },
  
  // Payments
  PAYMENTS: {
    REBOOST_CREDITS: `${SERVER_URI}/payments/reboost-credits`,
  },
  
  // Logs
  LOGS: {
    LIST: `${SERVER_URI}/logs`,
  },
  
  // Status
  STATUS: {
    HEALTH: `${SERVER_URI}/health`,
    SYSTEM: `${SERVER_URI}/system-status`,
    RECENT_EVENTS: `${SERVER_URI}/status/recent-events`,
    RECENT_EVENTS_BY_TYPE: (type: string) => `${SERVER_URI}/status/recent-events/${type}`,
  },
  
  // Triggers
  TRIGGERS: {
    LIST: `${SERVER_URI}/triggers`,
  },
  
  // Workflows
  WORKFLOWS: {
    LIST: `${SERVER_URI}/workflows`,
    DETAIL: (id: string) => `${SERVER_URI}/workflows/${id}`,
  },
};
