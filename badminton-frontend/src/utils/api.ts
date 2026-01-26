const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const api = {
  // Auth endpoints
  register: async (data: { email: string; username: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Athlete endpoints
  getAthletes: async () => {
    const response = await fetch(`${API_BASE_URL}/athletes`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getAthlete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/athletes/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  createAthlete: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/athletes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateAthlete: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/athletes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteAthlete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/athletes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Template endpoints (public, no auth required)
  getTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  getTemplate: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  // Session endpoints
  startSession: async (data: { athleteId: string; templateId?: string; targetZone?: string }) => {
    const response = await fetch(`${API_BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  stopSession: async (sessionId: string, data: { sessionNotes?: string; sessionRating?: number }) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/stop`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getSessions: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/sessions${queryString}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};

