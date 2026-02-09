import { API_ENDPOINTS } from '../config/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseMaybeJson = (value) => {
  if (typeof value !== 'string') return value;
  const t = value.trim();
  if (!t) return value;
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try {
      return JSON.parse(t);
    } catch (_) {
      return value;
    }
  }
  return value;
};

const chatHistory = {
  async getOrCreateTodaySession() {
    const res = await fetch(API_ENDPOINTS.CHAT_TODAY_SESSION, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to create/load today session');
    }
    return data.data;
  },

  async listSessions() {
    const res = await fetch(API_ENDPOINTS.CHAT_SESSIONS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to list sessions');
    }
    return data.data || [];
  },

  async getSessionMessages(sessionId) {
    const res = await fetch(API_ENDPOINTS.CHAT_SESSION_MESSAGES(sessionId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to load messages');
    }

    return (data.data || []).map((m) => {
      const metadata = parseMaybeJson(m.metadata);
      return {
        ...m,
        metadata,
      };
    });
  },

  async appendMessage(sessionId, message) {
    const res = await fetch(API_ENDPOINTS.CHAT_SESSION_MESSAGES(sessionId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(message),
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to append message');
    }
    return data.data;
  },
};

export default chatHistory;
