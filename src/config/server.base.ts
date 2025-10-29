/**
 * Centralized server URL configuration.
 * Always import URLs from this module instead of hardcoding them in components.
 */

const DEFAULT_SERVER_URL = 'https://automationwhats.stitchbyte.in';
const PRODUCTION_SERVER_URL = 'https://automationwhats.stitchbyte.in';

const getEnvValue = (key: string): string | undefined => {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const value = env?.[key];
  return value && value.trim() ? value.trim() : undefined;
};

const resolveServerUrl = (): string => {
  const apiBase = getEnvValue('NEXT_PUBLIC_API_BASE_URL');
  if (apiBase) {
    return apiBase;
  }

  const serverUrl = getEnvValue('NEXT_PUBLIC_SERVER_URL');
  if (serverUrl) {
    return serverUrl;
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname === 'localhost'
      ? DEFAULT_SERVER_URL
      : PRODUCTION_SERVER_URL;
  }

  return DEFAULT_SERVER_URL;
};

export const SERVER_LINKS = Object.freeze({
  DEFAULT: DEFAULT_SERVER_URL,
  PRODUCTION: PRODUCTION_SERVER_URL,
});

export const SERVER_URL = resolveServerUrl();

export const buildApiUrl = (endpoint: string): string => {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${SERVER_URL}${normalized}`;
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: buildApiUrl('/auth/login'),
    SIGNUP: buildApiUrl('/auth/signup'),
    LOGOUT: buildApiUrl('/auth/logout'),
  },
  CHAT: {
    CONTACTS: buildApiUrl('/chat/contacts'),
    MESSAGES: (phone: string) => buildApiUrl(`/chat/messages/${encodeURIComponent(phone)}`),
    CONTACT: (phone: string) => buildApiUrl(`/chat/contact/${encodeURIComponent(phone)}`),
    SEND_TEXT: buildApiUrl('/chat/send-text'),
    SEND_MEDIA: buildApiUrl('/chat/send-media'),
  },
  CAMPAIGNS: {
    LIST: buildApiUrl('/campaigns'),
    DETAIL: (id: string) => buildApiUrl(`/campaigns/${id}`),
    START: (id: string) => buildApiUrl(`/campaigns/${id}/start`),
    STOP: (id: string) => buildApiUrl(`/campaigns/${id}/stop`),
    STATUS: (id: string) => buildApiUrl(`/campaigns/${id}/status`),
  },
  BROADCASTS: {
    LIST: buildApiUrl('/broadcasts'),
    DETAIL: (id: string) => buildApiUrl(`/broadcasts/${id}`),
    SEND: (id: string) => buildApiUrl(`/broadcasts/${id}/send`),
  },
  TEMPLATES: {
    SUBMIT: buildApiUrl('/submit-template-with-file'),
  },
  PAYMENTS: {
    REBOOST_CREDITS: buildApiUrl('/payments/reboost-credits'),
  },
  LOGS: {
    LIST: buildApiUrl('/logs'),
  },
  STATUS: {
    HEALTH: buildApiUrl('/health'),
    SYSTEM: buildApiUrl('/system-status'),
    RECENT_EVENTS: buildApiUrl('/status/recent-events'),
    RECENT_EVENTS_BY_TYPE: (type: string) => buildApiUrl(`/status/recent-events/${type}`),
  },
  TRIGGERS: {
    LIST: buildApiUrl('/triggers'),
  },
  WORKFLOWS: {
    LIST: buildApiUrl('/workflows'),
    DETAIL: (id: string) => buildApiUrl(`/workflows/${id}`),
  },
} as const;

export default SERVER_URL;
