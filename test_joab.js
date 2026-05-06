
const axios = require('axios');

async function test() {
  const API_URL = 'http://localhost:5000/api';
  
  try {
    console.log('--- TESTE DE PERSISTÊNCIA JOAB ---');
    
    // 1. Login como Joab
    console.log('Efetuando login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'joab.marques',
      password: '123' // Supondo a senha padrão ou a que o server cria
    }).catch(e => {
        // Tenta a senha que o server gera em ensureAdmin (123456789)
        return axios.post(`${API_URL}/auth/login`, {
            username: 'joab.marques',
            password: '123456789'
        });
    });
    
    const { token, username } = loginRes.data;
    console.log(`Logado como ${username}. Token: ${token.substring(0, 10)}...`);
    
    const headers = { 'Authorization': `Bearer ${token}` };
    const date = new Date().toISOString().split('T')[0];
    
    // 2. Enviar stats
    console.log(`Enviando stats para a data ${date}...`);
    const statsData = {
      date: date,
      t: 10,
      c: 5,
      m: 2,
      cl: 1,
      userId: '' // Simula o filterUserId vazio do Joab
    };
    
    const saveRes = await axios.post(`${API_URL}/stats`, statsData, { headers });
    console.log('Resposta do save:', saveRes.data);
    
    // 3. Verificar se salvou
    console.log('Verificando stats salvos...');
    const getRes = await axios.get(`${API_URL}/stats`, { headers });
    const savedStat = getRes.data.find(s => s.date === date);
    
    if (savedStat && savedStat.t === 10) {
      console.log('✅ SUCESSO: Dados persistidos corretamente.');
    } else {
      console.log('❌ FALHA: Dados não encontrados ou incorretos.');
      console.log('Dados recebidos:', getRes.data);
    }
    
  } catch (err) {
    console.error('❌ ERRO NO TESTE:', err.response?.data || err.message);
  }
}

test();
