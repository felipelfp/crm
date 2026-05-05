const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export const leadService = {
  getLeads: async () => {
    const res = await fetch(`${API_URL}/leads`);
    return res.json();
  },
  saveLead: async (lead) => {
    const method = lead._id ? 'PUT' : 'POST';
    const url = lead._id ? `${API_URL}/leads/${lead._id}` : `${API_URL}/leads`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
    return res.json();
  },
  deleteLead: async (id) => {
    await fetch(`${API_URL}/leads/${id}`, { method: 'DELETE' });
  }
};

export const statService = {
  getStats: async () => {
    const res = await fetch(`${API_URL}/stats`);
    return res.json();
  },
  updateStats: async (data) => {
    const res = await fetch(`${API_URL}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

export const authService = {
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Falha no login');
    return res.json();
  }
};
