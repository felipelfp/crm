const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api';

const getHeaders = () => {
  const token = sessionStorage.getItem('luvi_token') || localStorage.getItem('luvi_token_v1');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Interceptador Global: Se o servidor disser que o token está inválido (mudança de senha, restart, etc), desloga na hora!
const customFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
      console.error("Sessão expirada ou acesso negado. Redirecionando...");
      localStorage.removeItem('luvi_token_v1');
      sessionStorage.removeItem('luvi_token');
      sessionStorage.removeItem('luvi_auth');
      // Força o reload para voltar ao login se o token mudou (ex: restart do servidor)
      window.location.href = '/'; 
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: res.status });
    }
    return res;
  } catch (e) {
    console.error("Erro de rede:", e);
    throw e;
  }
};

export const leadService = {
  getLeads: async (userId = null) => {
    const url = userId ? `${API_URL}/leads?userId=${userId}` : `${API_URL}/leads`;
    const res = await customFetch(url, { headers: getHeaders() });
    return res.json();
  },
  saveLead: async (lead) => {
    // ... (mesmo código)
    const method = lead._id ? 'PUT' : 'POST';
    const url = lead._id ? `${API_URL}/leads/${lead._id}` : `${API_URL}/leads`;
    const res = await customFetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(lead)
    });
    return res.json();
  },
  deleteLead: async (id) => {
    await customFetch(`${API_URL}/leads/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
  }
};

export const statService = {
  getStats: async (userId = null) => {
    const url = userId ? `${API_URL}/stats?userId=${userId}` : `${API_URL}/stats`;
    const res = await customFetch(url, { headers: getHeaders() });
    return res.json();
  },
  updateStats: async (data) => {
    const res = await customFetch(`${API_URL}/stats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Erro ao salvar estatísticas');
    }
    return res.json();
  },
  getTeamStats: async (date = null) => {
    const url = date ? `${API_URL}/team-stats?date=${date}` : `${API_URL}/team-stats`;
    const res = await customFetch(url, { headers: getHeaders() });
    return res.json();
  }
};

export const userService = {
  getUsers: async () => {
    const res = await customFetch(`${API_URL}/users`, { headers: getHeaders() });
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
