const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api';

const getHeaders = () => {
  const token = sessionStorage.getItem('luvi_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const leadService = {
  getLeads: async (userId = null) => {
    const url = userId ? `${API_URL}/leads?userId=${userId}` : `${API_URL}/leads`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },
  saveLead: async (lead) => {
    // ... (mesmo código)
    const method = lead._id ? 'PUT' : 'POST';
    const url = lead._id ? `${API_URL}/leads/${lead._id}` : `${API_URL}/leads`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(lead)
    });
    return res.json();
  },
  deleteLead: async (id) => {
    await fetch(`${API_URL}/leads/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
  }
};

export const statService = {
  getStats: async (userId = null) => {
    const url = userId ? `${API_URL}/stats?userId=${userId}` : `${API_URL}/stats`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },
  updateStats: async (data) => {
    const res = await fetch(`${API_URL}/stats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getTeamStats: async () => {
    const res = await fetch(`${API_URL}/team-stats`, {
      headers: getHeaders()
    });
    return res.json();
  }
};

export const userService = {
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
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
