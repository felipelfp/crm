import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './App.css';
import { leadService, statService, authService, userService } from './services/api';
import { leadsData } from './leadsData';

function App() {
  const [activeTab, setActiveTab] = useState('diario');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [currentBranch, setCurrentBranch] = useState('ESCOLAS');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [sessionNoteAdded, setSessionNoteAdded] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const chartInstances = useRef({});

  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('luvi_auth') === 'true');
  const [username, setUsername] = useState(() => sessionStorage.getItem('luvi_username') || '');
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('luvi_role') || 'USER');
  const [team, setTeam] = useState([]);
  const [teamStats, setTeamStats] = useState([]); // Estatísticas individuais de cada membro
  const [filterUserId, setFilterUserId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lastActionTime, setLastActionTime] = useState(0);

  const loadTeam = async () => {
    if (userRole !== 'MANAGER') return;
    try {
      const data = await userService.getUsers();
      setTeam(data);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    }
  };

  const handleLogin = async (user, pass) => {
    try {
      const lowerUser = user.toLowerCase().trim();
      const data = await authService.login(lowerUser, pass);
      
      const oldUser = (sessionStorage.getItem('luvi_username') || '').toLowerCase();
      if (oldUser && oldUser !== data.username.toLowerCase()) {
        // Limpa cache de leads antigo para evitar duplicidade com o novo banco
        localStorage.removeItem(`luvi_leads_${data.username}_v1`);
        localStorage.removeItem(`luvi_leads_${oldUser}_v1`);
      }

      setIsLoggedIn(true);
      setUsername(data.username);
      setUserRole(data.role);
      sessionStorage.setItem('luvi_auth', 'true');
      sessionStorage.setItem('luvi_token', data.token);
      sessionStorage.setItem('luvi_username', data.username);
      sessionStorage.setItem('luvi_role', data.role);
      setLoginError('');
      
      // Forçar recarregamento para garantir que o estado inicial do usuário seja aplicado
      window.location.reload();
    } catch (err) {
      setLoginError('Usuário ou senha incorretos ou erro no servidor.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setUserRole('USER');
    sessionStorage.removeItem('luvi_auth');
    sessionStorage.removeItem('luvi_token');
    sessionStorage.removeItem('luvi_username');
    sessionStorage.removeItem('luvi_role');
  };

  const [stats, setStats] = useState(() => {
    try {
      const user = sessionStorage.getItem('luvi_username') || 'guest';
      const saved = localStorage.getItem(`luvi_crm_${user}_v1`);
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.byDate) return parsed;
      }
    } catch (e) {
      console.error("Error parsing stats from localStorage", e);
    }
    return {
      diaria: {t:0, c:0, m:0, cl:0},
      semanal: { w1:{t:0, c:0, m:0, cl:0}, w2:{t:0, c:0, m:0, cl:0}, w3:{t:0, c:0, m:0, cl:0}, w4:{t:0, c:0, m:0, cl:0} },
      mensal: {t:0, c:0, m:0, cl:0},
      byDate: {},
      weeklyGoals: { c: 120, m: 6, cl: 2 },
      monthlyGoals: { c: 480, m: 24, cl: 8 }
    };
  });

  const [leads, setLeads] = useState(() => {
    try {
      const user = sessionStorage.getItem('luvi_username') || 'guest';
      const saved = localStorage.getItem(`luvi_leads_${user}_v1`);
      let baseLeads = (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
      
      const seenNames = new Set();
      const finalLeads = [];
      const combined = (baseLeads && baseLeads.length > 0) ? baseLeads : leadsData;
      
      combined.forEach(l => {
        if (!l || !l.name) return;
        const name = l.name.toUpperCase().trim();
        if (!seenNames.has(name) && name.length > 2) {
          seenNames.add(name);
          
          // Preserva a categoria que vem do banco/arquivo sem tentar adivinhar
          const cat = l.category || 'SERVIÇOS';
          
          finalLeads.push({
            id: l.id || Math.random(),
            _id: l._id || null,
            name: l.name,
            phone: l.phone || '',
            resp: l.resp && l.resp !== 'Felipe' ? l.resp : '',
            status: l.status || 'Pendente',
            week: l.week || 'Semana 1',
            notes: l.address || l.notes || '',
            category: cat,
            address: l.address || '',
            regional: l.regional || '',
            history: l.history || []
          });
        }
      });
      
      return finalLeads;
    } catch (e) {
      console.error("Error initializing leads", e);
      return [];
    }
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    const user = username || 'guest';
    localStorage.setItem(`luvi_crm_${user}_v1`, JSON.stringify(stats));
    localStorage.setItem(`luvi_leads_${user}_v1`, JSON.stringify(leads));
    
    // Só renderizamos se não houver um timer pendente
    const timer = setTimeout(() => renderCharts(), 100);
    return () => clearTimeout(timer);
  }, [stats, leads, history, activeTab, selectedDate, endDate, selectedMonth]);

  // Limpeza de gráficos ao trocar de aba (para evitar fantasmas)
  useEffect(() => {
    return () => {
      Object.keys(chartInstances.current).forEach(key => {
        if (chartInstances.current[key]) {
          chartInstances.current[key].destroy();
          chartInstances.current[key] = null;
        }
      });
    };
  }, [activeTab]);

  // CARREGAR LISTA DE EQUIPE (MANAGER ONLY)
  useEffect(() => {
    if (isLoggedIn && userRole === 'MANAGER') {
      loadTeam();
    }
  }, [isLoggedIn, userRole]);

  // TESTE DE CONEXÃO
  useEffect(() => {
    const checkConn = async () => {
      try {
        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api';
        const res = await fetch(`${API_URL}/health`);
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };
    checkConn();
    const interval = setInterval(checkConn, 10000);
    return () => clearInterval(interval);
  }, []);

  // CARREGAR DADOS DO SERVIDOR
  useEffect(() => {
    const loadData = async () => {
      if (!isLoggedIn) return;
      try {
        const serverLeads = await leadService.getLeads(filterUserId);
        setIsOnline(true);
        if (serverLeads && Array.isArray(serverLeads)) {
          // PRIORIDADE TOTAL AO SERVIDOR: Evita duplicados vindo do cache local
          setLeads(serverLeads);
          
          // Sincronização de emergência: se o Felipe tiver algo que REALMENTE não está no servidor
          if (username === 'felipe.possa' && !filterUserId) {
            const localSaved = localStorage.getItem(`luvi_leads_${username}_v1`);
            if (localSaved) {
              const localLeads = JSON.parse(localSaved);
              const serverNames = new Set(serverLeads.map(l => (l.name || "").toUpperCase().trim()));
              localLeads.forEach(l => {
                const name = (l.name || "").toUpperCase().trim();
                if (name && !serverNames.has(name)) {
                  console.log("☁️ Recuperando lead local ausente no servidor:", l.name);
                  leadService.saveLead(l).catch(() => {});
                }
              });
            }
          }
        }
        
        const serverStats = await statService.getStats(filterUserId);
        if (serverStats && Array.isArray(serverStats)) {
          const statsMap = {};
          serverStats.forEach(s => { 
            if(s && s.date) {
              // Metas fixas e corretas: 30 por pessoa, 60 total (ou 480/24/8 mensal)
              const baseG = (!filterUserId && userRole === 'MANAGER') ? 60 : 30;
              statsMap[s.date] = { ...s, goal: s.goal || baseG };
            } 
          });
          setStats(prev => ({ ...prev, byDate: statsMap }));
        }

        // Se for gestora, pega o comparativo da equipe
        if (userRole === 'MANAGER') {
          const tStats = await statService.getTeamStats();
          if (tStats && Array.isArray(tStats)) setTeamStats(tStats);
        }
      } catch (err) {
        setIsOnline(false);
      }
    };
    const interval = setInterval(() => {
      // SÓ ATUALIZA SE NÃO HOUVER AÇÃO RECENTE POR 60 SEGUNDOS
      // Isso evita que o servidor 'atropele' um clique rápido (como +1 Tentativa)
      if (Date.now() - lastActionTime > 60000) {
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, filterUserId, userRole, lastActionTime]);

  const renderCharts = () => {
    const updateOrCreate = (key, ctx, config) => {
      try {
        if (chartInstances.current[key] && chartInstances.current[key].ctx) {
          const chart = chartInstances.current[key];
          chart.data.datasets = config.data.datasets;
          if (config.data.labels) chart.data.labels = config.data.labels;
          chart.update('none'); 
        } else {
          if (chartInstances.current[key]) chartInstances.current[key].destroy();
          chartInstances.current[key] = new Chart(ctx, config);
        }
      } catch (e) {
        console.error("Erro ao renderizar gráfico:", key, e);
        // Se der erro, tentamos recriar do zero na próxima
        chartInstances.current[key] = null;
      }
    };

    // DIÁRIO
    const dailyCtx = document.getElementById('dailyPieChart');
    if (activeTab === 'diario' && dailyCtx) {
      const dayData = getDayData(selectedDate);
      updateOrCreate('daily', dailyCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Tentativas', 'Ligações', 'Reuniões', 'Clientes'],
          datasets: [{
            data: [dayData.t || 0, dayData.c || 0, dayData.m || 0, dayData.cl || 0],
            backgroundColor: ['#64748b', '#10b981', '#f43f5e', '#06b6d4'],
            hoverOffset: 12, borderWidth: 2, borderColor: '#ffffff'
          }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: '600' } } } } }
      });
    }

    // SEMANAL
    const weeklyPieCtx = document.getElementById('weeklyPieChart');
    if (activeTab === 'semanal' && weeklyPieCtx) {
      const rangeData = getRangeStats(selectedDate, endDate).total;
      updateOrCreate('weeklyPie', weeklyPieCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Tentativas', 'Ligações', 'Reuniões', 'Clientes'],
          datasets: [{
            data: [rangeData.t || 0, rangeData.c || 0, rangeData.m || 0, rangeData.cl || 0],
            backgroundColor: ['#64748b', '#10b981', '#f43f5e', '#06b6d4'],
            hoverOffset: 10, borderWidth: 2, borderColor: '#ffffff'
          }]
        },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: '600' } } } } }
      });
    }

    // GRÁFICO DE LINHA (MENSAL)
    const monthlyCtx = document.getElementById('monthlyLineChart');
    if (activeTab === 'mensal' && monthlyCtx) {
      const mStats = getMonthStats(selectedMonth);
      const ctx = monthlyCtx.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

      updateOrCreate('monthly', ctx, {
        type: 'line',
        data: {
          labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
          datasets: [
            {
              label: 'Realizado',
              data: mStats.weeks.map(w => w.c),
              borderColor: '#2563eb',
              backgroundColor: gradient,
              fill: true,
              tension: 0.4,
              borderWidth: 4,
              pointRadius: 6,
              pointBackgroundColor: '#fff',
              pointBorderColor: '#2563eb',
              pointBorderWidth: 3
            },
            {
              label: 'Meta',
              data: Array(4).fill((stats.monthlyGoals?.c || 480) / 4 * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)),
              borderColor: 'rgba(244, 63, 94, 0.3)',
              borderDash: [5, 5],
              fill: false,
              tension: 0,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'top',
              labels: { font: { size: 11, weight: '600' }, usePointStyle: false } 
            } 
          },
          scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
        }
      });
    }
  };

  const getDayData = (date) => {
    const defaultGoal = (userRole === 'MANAGER' && !filterUserId) ? 60 : 30;
    return stats.byDate[date] || { t: 0, c: 0, m: 0, cl: 0, goal: defaultGoal };
  };

  const updateM = (t, v) => {
    const dKey = selectedDate;
    setLastActionTime(Date.now());
    setStats(prev => {
      const newStats = JSON.parse(JSON.stringify(prev));
      if (!newStats.byDate[dKey]) newStats.byDate[dKey] = {t:0, c:0, m:0, cl:0};
      const day = newStats.byDate[dKey];
      if(t===0) { day.c+=v; day.t+=v; }
      if(t===1) { day.m+=v; }
      if(t===2) { day.cl+=v; }
      if(t===3) { day.t+=v; }
      newStats.diaria = {...day};
      
      // Salva local IMEDIATO para ser rápido
      localStorage.setItem(`luvi_crm_${username}_v1`, JSON.stringify(newStats));
      
      // Sincroniza com servidor em background
      statService.updateStats({ date: dKey, ...day }).catch(() => {});
      
      return newStats;
    });
  };

  const setManualValue = (t, val) => {
    const dKey = selectedDate;
    const newValue = val === '' ? 0 : parseInt(val);
    if (isNaN(newValue)) return;
    setLastActionTime(Date.now());
    setStats(prev => {
      const newStats = JSON.parse(JSON.stringify(prev));
      if (!newStats.byDate[dKey]) newStats.byDate[dKey] = {t:0, c:0, m:0, cl:0};
      const day = newStats.byDate[dKey];
      if(t===0) day.c = newValue;
      if(t===1) day.m = newValue;
      if(t===2) day.cl = newValue;
      if(t===3) day.t = newValue;
      newStats.diaria = {...day};
      localStorage.setItem(`luvi_crm_${username}_v1`, JSON.stringify(newStats));
      statService.updateStats({ date: dKey, ...day }).catch(() => {});
      return newStats;
    });
  };

  const setManualGoal = (val) => {
    const dKey = selectedDate;
    const newValue = val === '' ? 0 : parseInt(val);
    if (isNaN(newValue)) return;
    setLastActionTime(Date.now());
    setStats(prev => {
      const newStats = JSON.parse(JSON.stringify(prev));
      if (!newStats.byDate[dKey]) newStats.byDate[dKey] = {t:0, c:0, m:0, cl:0};
      newStats.byDate[dKey].goal = newValue;
      localStorage.setItem(`luvi_crm_${username}_v1`, JSON.stringify(newStats));
      statService.updateStats({ date: dKey, ...newStats.byDate[dKey] }).catch(() => {});
      return newStats;
    });
  };

  const updatePeriodValue = (type, newVal, currentTotal) => {
    const value = newVal === '' ? 0 : parseInt(newVal);
    if (isNaN(value)) return;
    const diff = value - currentTotal;
    if (diff === 0) return;

    // Aplica a diferença ao dia selecionado
    const tMap = { 'c': 0, 'm': 1, 'cl': 2, 't': 3 };
    updateM(tMap[type], diff);
  };

  const updateGlobalGoal = (type, period, val) => {
    const newValue = val === '' ? 0 : parseInt(val);
    if (isNaN(newValue)) return;
    setStats(prev => {
      const newStats = { ...prev };
      const key = period === 'weekly' ? 'weeklyGoals' : 'monthlyGoals';
      newStats[key] = { ...newStats[key], [type]: newValue };
      localStorage.setItem(`luvi_crm_${username}_v1`, JSON.stringify(newStats));
      // Sincronizar com o servidor (como uma estatística especial ou apenas local por enquanto)
      return newStats;
    });
  };

  const getRangeStats = (start, end) => {
    const s = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    let total = {t:0, c:0, m:0, cl:0};
    const dailyBreakdown = [];
    const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    for(let i=0; i<diffDays; i++) {
      const d = new Date(s); d.setDate(s.getDate() + i);
      const current = d.toISOString().split('T')[0];
      const dayOfWeek = (d.getDay() + 6) % 7;
      const label = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][dayOfWeek];
      const data = getDayData(current);
      total.t += data.t; total.c += data.c; total.m += data.m; total.cl += data.cl;
      dailyBreakdown.push({ date: current, label, ...data, goal: [15,30,30,30,15,0,0][dayOfWeek] });
    }
    return { total, dailyBreakdown, range: { start, end } };
  };

  const getMonthStats = (monthIndex) => {
    let total = {t:0, c:0, m:0, cl:0};
    const year = 2026;
    const weeks = [
      {t:0, c:0, m:0, cl:0},
      {t:0, c:0, m:0, cl:0},
      {t:0, c:0, m:0, cl:0},
      {t:0, c:0, m:0, cl:0}
    ];

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    for(let d=1; d<=daysInMonth; d++) {
      const dateStr = `${year}-${(monthIndex+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
      const data = getDayData(dateStr);
      
      total.t += data.t;
      total.c += data.c;
      total.m += data.m;
      total.cl += data.cl;

      // Distribuir em 4 semanas simplificadas para o demonstrativo
      const weekIdx = Math.min(Math.floor((d-1) / 7), 3);
      weeks[weekIdx].t += data.t;
      weeks[weekIdx].c += data.c;
      weeks[weekIdx].m += data.m;
      weeks[weekIdx].cl += data.cl;
    }

    return { total, weeks };
  };

  const exportBackup = () => {
    const data = {
      leads,
      stats,
      history,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_crm_luvi_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const saveLead = (data) => {
    // Salvamento Instantâneo (Optimistic Update)
    const tempId = data.id === 'new' ? Date.now() : data.id;
    const finalData = { ...data, id: tempId };
    
    setLastActionTime(Date.now());
    // ATUALIZAÇÃO OTIMISTA: Muda na tela na hora
    setLeads(prev => {
      const updated = data.id === 'new' ? [finalData, ...prev] : prev.map(l => (l._id && l._id === data._id) || (l.id === data.id) ? finalData : l);
      localStorage.setItem(`luvi_leads_${username}_v1`, JSON.stringify(updated));
      return updated;
    });

    setSelectedLead(null);

    // Se houve nota adicionada nesta sessão ou o status mudou para algo produtivo, atualizamos os stats automaticamente
    if (sessionNoteAdded) {
      updateM(0, 1); // +1 Ligação automática ao salvar com anotação
    }

    // Sincronização em segundo plano
    leadService.saveLead(finalData).then(saved => {
      if (saved && saved._id) {
        setLeads(prev => prev.map(l => (l._id && l._id === saved._id) || (l.id === tempId) ? saved : l));
      }
    }).catch(err => {
      console.warn("Erro ao sincronizar lead, tentando novamente...", err);
    });
  };

  const baseSchools = leads.filter(l => l.category === currentBranch);

  const getLocalDate = () => {
    const d = new Date();
    // Ajuste rigoroso para o fuso de Brasília (GMT-3)
    const brDate = new Date(d.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const year = brDate.getFullYear();
    const month = String(brDate.getMonth() + 1).padStart(2, '0');
    const day = String(brDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openLeadModal = (l) => {
    setSessionNoteAdded(false);
    setSelectedLead(l);
  };

  return (
    <div className="main-wrapper">
      {!isLoggedIn ? (
        <div className="login-screen">
          <form className="login-card" onSubmit={(e) => {
            e.preventDefault();
            handleLogin(document.getElementById('login-user').value, document.getElementById('login-pass').value);
          }}>
            <div className="login-logo"><i className="fa-solid fa-shield-halved"></i></div>
            <h2>Acesso Restrito</h2>
            <p>Entre com suas credenciais para gerenciar o CRM.</p>
            
            <div className="login-input-group">
              <label htmlFor="login-user">Usuário</label>
              <div className="login-field-wrap">
                <i className="fa-solid fa-user"></i>
                <input 
                  type="text" 
                  id="login-user" 
                  name="username"
                  placeholder="seu.nome" 
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="login-pass">Senha</label>
              <div className="login-field-wrap">
                <i className="fa-solid fa-lock"></i>
                <input 
                  type="password" 
                  id="login-pass" 
                  name="password"
                  placeholder="••••••••" 
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="btn-login">
              Entrar no Sistema
            </button>

            {loginError && <span className="login-error">{loginError}</span>}
          </form>
        </div>
      ) : (
        <>
          <div className="sys-header">
            <div className="header-left" style={{display:'flex', alignItems:'center', gap:'20px'}}>
              <h2 style={{display:'flex', alignItems:'center', gap:'15px', margin:0}}>
                <i className="fa-solid fa-box" style={{color:'var(--primary)'}}></i>
                DASHBOARD GERENCIAL — SISTEMA DE VENDAS
              </h2>
              
              <div className={`status-badge ${isOnline ? 'online' : 'offline'}`} style={{fontSize:'0.65rem', padding:'4px 10px'}}>
                <span className="status-dot"></span>
                {isOnline ? 'CONECTADO' : 'OFFLINE'}
              </div>

              {userRole === 'MANAGER' && (
                <div className="manager-filter-inline" style={{display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.05)', padding:'4px 12px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)'}}>
                  <span style={{fontSize:'0.6rem', fontWeight:800, color:'#94a3b8', whiteSpace:'nowrap'}}>VER EQUIPE:</span>
                  <select 
                    value={filterUserId} 
                    onChange={(e) => setFilterUserId(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      outline: 'none',
                      cursor: 'pointer',
                      padding: '2px 0'
                    }}
                  >
                    <option value="" style={{color:'#1e293b'}}>Toda a Equipe</option>
                    {team.length > 0 ? team.map(u => (
                      <option key={u._id} value={u._id} style={{color:'#1e293b'}}>{u.username}</option>
                    )) : (
                      <>
                        <option value="felipe.possa" style={{color:'#1e293b'}}>felipe.possa</option>
                        <option value="Joab.marques" style={{color:'#1e293b'}}>Joab.marques</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
            <div className="header-right" style={{display:'flex', alignItems:'center'}}>
              <button onClick={exportBackup} title="Baixar Backup dos Dados" style={{background:'rgba(37,99,235,0.1)', border:'none', color:'var(--primary)', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', marginRight:'15px', fontWeight:700, fontSize:'0.7rem'}}>
                <i className="fa-solid fa-download" style={{marginRight:'5px'}}></i> BACKUP
              </button>
              <div style={{display:'flex', alignItems:'center', gap:'8px', color:'var(--primary)', fontWeight:800}}>
                <i className="fa-regular fa-circle-user" style={{fontSize:'1.2rem'}}></i>
                <div style={{display:'flex', flexDirection:'column', lineHeight:1}}>
                  <span style={{fontSize:'0.8rem'}}>{username}</span>
                  {userRole === 'MANAGER' && <span style={{fontSize:'0.5rem', color:'#be123c'}}>GESTORA</span>}
                </div>
              </div>
              <button onClick={handleLogout} style={{background:'none', border:'none', color:'#ef4444', marginLeft:'20px', cursor:'pointer', fontWeight:700}}>Sair</button>
            </div>
          </div>

      <div className="sys-container">
        <div className="sys-sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon"><i className="fa-solid fa-chart-line"></i></div>
            <div className="logo-text"><h3>covii.soft</h3><span>Gerencial Vendas</span></div>
          </div>
          <div className="sidebar-label">CRM E PROSPECÇÃO</div>
          <div className="sidebar-nav">
            {userRole !== 'MANAGER' && (
              <div className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}><i className="fa-solid fa-address-book"></i> Gestão de Leads</div>
            )}
            <div className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}><i className="fa-solid fa-square-poll-vertical"></i> Resultados</div>
          </div>
          
          <div className="sidebar-label">INDICADORES</div>
          <div className="sidebar-nav">
            <div className={`nav-item ${activeTab === 'diario' ? 'active' : ''}`} onClick={() => setActiveTab('diario')}><i className="fa-solid fa-calendar-check"></i> Diário</div>
            <div className={`nav-item ${activeTab === 'semanal' ? 'active' : ''}`} onClick={() => setActiveTab('semanal')}><i className="fa-solid fa-calendar-days"></i> Semanal</div>
            <div className={`nav-item ${activeTab === 'mensal' ? 'active' : ''}`} onClick={() => setActiveTab('mensal')}><i className="fa-solid fa-chart-pie"></i> Mensal</div>
          </div>
          
          <div style={{marginTop:'auto', padding:'20px', fontSize:'0.65rem', color:'#475569', textAlign:'center', borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            v0.0.001
          </div>
        </div>

        <div className="sys-content">
          {/* DIARIO */}
          {activeTab === 'diario' && (
            <div className="content-panel active">
              <div className="card-section">
                <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span><i className="fa-solid fa-clock" style={{marginRight:'8px'}}></i> INDICADORES DIÁRIOS - {selectedDate.split('-').reverse().join('/')}</span>
                  <button onClick={() => setShowCalendar(true)} style={{background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontWeight:'700', fontSize:'0.85rem'}}>
                    <i className="fa-solid fa-calendar-days" style={{marginRight:'5px'}}></i> Calendário
                  </button>
                </div>

                {/* MONITORAMENTO DE PERFORMANCE (GESTORA) */}
                {userRole === 'MANAGER' && !filterUserId && teamStats.length > 0 && (
                  <div style={{padding:'20px', borderTop:'1px solid #f1f5f9', background:'#fff'}}>
                    <div style={{fontSize:'0.75rem', fontWeight:800, color:'#1e293b', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
                      <div style={{width:'4px', height:'16px', background:'var(--primary)', borderRadius:'2px'}}></div>
                      PERFORMANCE DA EQUIPE HOJE
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'25px'}}>
                      {teamStats.map(member => {
                        const s = member.stats;
                        const callGoal = s.goal || 30;
                        const callPerc = Math.min(100, (s.c / callGoal) * 100);
                        return (
                          <div key={member.userId} className="manager-team-card" style={{background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <div style={{width:'35px', height:'35px', background:'var(--primary)', color:'#fff', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem'}}>
                                  {member.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{fontWeight:800, fontSize:'0.85rem', color:'#1e293b'}}>{member.username.toUpperCase()}</div>
                                  <div style={{fontSize:'0.6rem', color:'#64748b', fontWeight:700}}>CONSULTOR ATIVO</div>
                                </div>
                              </div>
                              <div style={{textAlign:'right'}}>
                                <div style={{fontSize:'1.1rem', fontWeight:800, color:'var(--primary)'}}>{s.c} <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>/ {callGoal}</span></div>
                                <div style={{fontSize:'0.6rem', fontWeight:800, color: callPerc >= 100 ? '#059669' : '#f59e0b'}}>{callPerc.toFixed(1)}%</div>
                              </div>
                            </div>
                            <div style={{height:'8px', background:'#f1f5f9', borderRadius:'4px', overflow:'hidden', marginBottom:'10px'}}>
                              <div style={{width:`${callPerc}%`, height:'100%', background: callPerc >= 100 ? '#10b981' : 'var(--primary)', transition:'width 1s ease'}}></div>
                            </div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                              <div style={{textAlign:'center', background:'#f8fafc', padding:'8px', borderRadius:'8px'}}>
                                <div style={{fontSize:'0.5rem', color:'#64748b', fontWeight:800}}>TENTATIVAS</div>
                                <div style={{fontSize:'0.85rem', fontWeight:800}}>{s.t}</div>
                              </div>
                              <div style={{textAlign:'center', background:'#f8fafc', padding:'8px', borderRadius:'8px'}}>
                                <div style={{fontSize:'0.5rem', color:'#64748b', fontWeight:800}}>LIGAÇÕES</div>
                                <div style={{fontSize:'0.85rem', fontWeight:800}}>{s.c}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {userRole !== 'MANAGER' && (
                  <>
                    <div className="card-header" style={{background:'transparent', border:'none', marginTop:'10px'}}><i className="fa-solid fa-bolt" style={{color:'#f59e0b', marginRight:'8px'}}></i> LANÇAMENTO RÁPIDO</div>
                    <div className="action-grid" style={{gridTemplateColumns:'repeat(6, 1fr)'}}>
                      <div className="btn-action" onClick={() => updateM(3, 1)}><i className="fa-solid fa-phone-slash" style={{color:'#475569'}}></i><span>+1 Tentativa</span></div>
                      <div className="btn-action" onClick={() => updateM(0, 1)}><i className="fa-solid fa-phone" style={{color:'#2563eb'}}></i><span>+1 Ligação</span></div>
                      <div className="btn-action" onClick={() => updateM(1, 1)}><i className="fa-solid fa-handshake" style={{color:'#be123c'}}></i><span>+1 Reunião</span></div>
                      <div className="btn-action" onClick={() => updateM(2, 1)}><i className="fa-solid fa-trophy" style={{color:'#0891b2'}}></i><span>+1 Cliente</span></div>
                      <div className="btn-action" onClick={() => { 
                        if(window.confirm('Limpar os dados deste dia?')) {
                          const cleared = {t:0, c:0, m:0, cl:0};
                          setStats(prev => ({...prev, byDate: {...prev.byDate, [selectedDate]: cleared}, diaria: cleared}));
                          statService.updateStats({ date: selectedDate, ...cleared }).catch(() => {});
                          setLastActionTime(Date.now());
                        }
                      }}><i className="fa-solid fa-arrows-rotate" style={{color:'#64748b'}}></i><span>Limpar Dia</span></div>
                      <div className="btn-action" onClick={() => openLeadModal({id:'new', name:'', phone:''})}><i className="fa-solid fa-circle-plus" style={{color:'#10b981'}}></i><span>Registrar Lead</span></div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="stat-grid" style={{marginTop:'15px'}}>
                <div className="card-section">
                  <div className="card-header"><i className="fa-solid fa-chart-pie" style={{color:'#0d9488', marginRight:'8px'}}></i> DISTRIBUIÇÃO DO DIA</div>
                  <div style={{padding:'20px', flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}><canvas id="dailyPieChart" style={{maxHeight:'240px'}}></canvas></div>
                </div>
                <div className="colored-stats">
                  <div className="card-header" style={{background:'transparent', border:'none'}}><i className="fa-solid fa-address-book" style={{color:'#be123c', marginRight:'8px'}}></i> DEMONSTRATIVO GERENCIAL</div>
                  
                  <div className="stat-card grey">
                    <h4>Tentativas / Caixa Postal</h4>
                    <div className="value-container">
                      <input 
                        type="number" 
                        className="value-input" 
                        value={getDayData(selectedDate).t} 
                        onChange={(e) => setManualValue(3, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        style={{width:'90px', background:'none', border:'none', fontWeight:800, color:'#475569', outline:'none', textAlign:'center', fontSize:'1.8rem'}}
                      />
                    </div>
                    <div className="goal-info">Não atendidas no dia</div>
                    <i className="fa-solid fa-phone-slash"></i>
                  </div>
                  
                  <div className="stat-card teal">
                    <h4>Ligações Produtivas</h4>
                    <div className="value-container">
                      <input 
                        type="number" 
                        className="value-input" 
                        value={getDayData(selectedDate).c} 
                        onChange={(e) => setManualValue(0, e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                      <span className="goal-separator">/</span>
                      <span className="goal-value">{getDayData(selectedDate).goal}</span>
                    </div>
                    <div className="goal-info">Contatos efetivos ✅</div>
                    <i className="fa-solid fa-phone"></i>
                  </div>

                  </div>
              </div>
            </div>
          )}

          {/* LEADS UNIFICADO */}
          {activeTab === 'leads' && (
            <div className="content-panel active">
              <div className="card-section">
                <div className="card-header"><i className="fa-solid fa-magnifying-glass" style={{marginRight:'8px'}}></i> PROSPECÇÃO INTELIGENTE (GOOGLE MAPS)</div>
                <div className="form-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'15px', padding:'15px'}}>
                  <div className="form-group"><label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'5px', display:'block'}}>FILTRO DE BUSCA</label><input type="text" placeholder="Ex: Escolas em Curitiba" style={{width:'100%', padding:'10px', border:'1px solid #e2e8f0', borderRadius:'6px'}} /></div>
                  <div className="form-group"><label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'5px', display:'block'}}>LOCALIZAÇÃO</label><input type="text" placeholder="Cidade ou Bairro" style={{width:'100%', padding:'10px', border:'1px solid #e2e8f0', borderRadius:'6px'}} /></div>
                  <button className="btn-save" style={{height:'38px', marginTop:'auto', background:'var(--primary)', color:'#fff', border:'none', padding:'0 25px', borderRadius:'6px', fontWeight:700, cursor:'pointer'}}>Varredura</button>
                </div>
              </div>

              <div className="card-section" style={{marginTop:'15px', flex:1}}>
                <div className="category-tabs" style={{display:'flex', gap:'10px', padding:'12px', borderBottom:'1px solid #f1f5f9', background:'#f8fafc', alignItems:'center', flexWrap:'wrap'}}>
                  <div className="search-box" style={{position:'relative', marginRight:'10px', flex:1, minWidth:'200px'}}>
                    <i className="fa-solid fa-magnifying-glass" style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'0.8rem'}}></i>
                    <input 
                      type="text" 
                      placeholder="Filtrar por nome do cliente..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{width:'100%', padding:'8px 12px 8px 35px', borderRadius:'20px', border:'1px solid #e2e8f0', fontSize:'0.75rem', outline:'none', transition:'all 0.2s'}}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div style={{position:'relative'}}>
                    <button 
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      style={{
                        padding:'8px 20px', 
                        borderRadius:'20px', 
                        border:'1px solid #e2e8f0', 
                        fontSize:'0.7rem', 
                        fontWeight:800, 
                        cursor:'pointer', 
                        background: '#fff', 
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '150px',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{currentBranch}</span>
                      <i className={`fa-solid fa-chevron-${showCategoryDropdown ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {showCategoryDropdown && (
                      <div style={{
                        position:'absolute', 
                        top:'110%', 
                        left:0, 
                        background:'#fff', 
                        border:'1px solid #e2e8f0', 
                        borderRadius:'12px', 
                        boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)', 
                        zIndex:100,
                        width: '100%',
                        overflow: 'hidden'
                      }}>
                        {['CONSTRUTORAS', 'ESCOLAS', 'FACULDADES', 'SERVIÇOS', 'FACILITIES', 'ALIMENTÍCIO'].map(cat => (
                          <div 
                            key={cat}
                            onClick={() => {
                              setCurrentBranch(cat);
                              setSearchTerm('');
                              setShowCategoryDropdown(false);
                            }}
                            style={{
                              padding: '10px 15px',
                              fontSize: '0.7rem',
                              fontWeight: currentBranch === cat ? 800 : 600,
                              color: currentBranch === cat ? 'var(--primary)' : '#64748b',
                              background: currentBranch === cat ? '#f8fafc' : 'transparent',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.target.style.background = currentBranch === cat ? '#f8fafc' : 'transparent'}
                          >
                            {cat}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="tab-filter" style={{marginLeft:'auto', background:'#10b981', color:'#fff', border:'none', padding:'8px 20px', borderRadius:'20px', fontWeight:800, cursor:'pointer'}} onClick={() => openLeadModal({id:'new', name:'', phone:'', category: currentBranch})}>+ Novo Lead</button>
                </div>
                <div className="table-wrap">
                  <table className="sys-table">
                    <thead><tr><th>Lead / Empresa</th><th>Telefone</th><th>Bairro / Regional</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                      {leads.filter(l => {
                        if (!l || !l.name) return false;
                        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = l.category === currentBranch;
                        // Se houver busca, ignoramos o filtro de status "Pendente" para encontrar qualquer cliente
                        if (searchTerm) return matchesSearch;
                        return matchesCategory && !l.lastCall && !l.nextFollowUp && l.status === 'Pendente';
                      }).map(l => (
                        <tr key={l.id}>
                          <td onClick={() => openLeadModal(l)} style={{fontWeight:600, color:'var(--primary)', cursor:'pointer'}}>{l.name}</td>
                          <td>{l.phone}</td>
                          <td>{l.address || '—'}</td>
                          <td><span className="badge badge-status" style={{background: l.status === 'Pendente' ? '#f1f5f9' : '#dcfce7', color: l.status === 'Pendente' ? '#475569' : '#166534', padding:'4px 8px', borderRadius:'4px', fontSize:'0.6rem', fontWeight:800}}>{l.status}</span></td>
                          <td>
                            <div style={{display:'flex', gap:'5px'}}>
                              <button className="btn-ligar" title="Registrar Ligação" onClick={() => {
                                const updatedLead = {...l, lastCall: getLocalDate(), status: 'Contatado', consultant: username};
                                updateM(0, 1);
                                setLeads(prev => prev.map(item => (item._id && item._id === l._id) || (item.id === l.id) ? updatedLead : item));
                                leadService.saveLead(updatedLead).catch(e => console.error("Erro ao salvar ligação:", e));
                              }}><i className="fa-solid fa-phone"></i></button>
                              <button className="btn-reuniao" title="Agendar Reunião" onClick={() => {
                                updateM(1, 1);
                                openLeadModal({...l, status: 'Reunião'});
                              }}><i className="fa-solid fa-handshake"></i></button>
                              <button className="btn-editar" onClick={() => openLeadModal(l)}><i className="fa-solid fa-edit"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {leads.filter(l => {
                        if (!l || !l.name) return false;
                        if (searchTerm) return l.name.toLowerCase().includes(searchTerm.toLowerCase());
                        return l.category === currentBranch && !l.lastCall && !l.nextFollowUp && l.status === 'Pendente';
                      }).length === 0 && (
                        <tr><td colSpan="5" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>{searchTerm ? 'Nenhum cliente encontrado com este nome.' : 'Nenhum lead pendente nesta categoria (todos já foram contatados ou agendados).'}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agenda' && (() => {
            const today = getLocalDate();
            
            // Deduplicação: Pegar apenas o último registro de cada lead
            const getUniqueLeads = (list) => {
              const seen = new Set();
              return list.filter(l => {
                if (!l._id) return true; // Para novos leads sem ID ainda
                if (seen.has(l._id)) return false;
                seen.add(l._id);
                return true;
              });
            };

            // FILTRO DE PRIVACIDADE: Usuário comum só vê os SEUS leads na Agenda/Resultados
            const myLeads = leads.filter(l => {
              if (userRole === 'MANAGER') return true;
              // No back-end o userId pode vir como objeto ou ID string. 
              // Comparamos com o consultant (nome) que é mais seguro agora.
              return l.consultant === username;
            });

            // Resultados: Leads contatados (não importa o dia, para não sumir)
            const resultsLeads = getUniqueLeads(myLeads.filter(l => l.lastCall));
            
            // Retornos: Todos os agendados (inclusive atrasados para não sumir)
            const pendingFollowUps = getUniqueLeads(myLeads.filter(l => l.nextFollowUp))
              .sort((a,b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp));

            return (
              <div className="content-panel active" style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                <div className="card-section">
                  <div className="card-header" style={{background:'#f0f9ff', color:'#0369a1'}}>
                    <i className="fa-solid fa-check-double" style={{marginRight:'8px'}}></i> 
                    CONTATOS REALIZADOS (RESULTADOS) 
                    <span style={{fontSize:'0.7rem', marginLeft:'10px', opacity:0.7}}>(Ficam aqui até serem atualizados)</span>
                  </div>
                  <div className="table-wrap">
                    <table className="sys-table">
                      <thead>
                        <tr>
                          <th>Lead / Empresa</th>
                          {userRole === 'MANAGER' && <th>Consultor</th>}
                          <th>Status</th>
                          <th>Último Contato</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultsLeads.map(l => (
                          <tr key={l._id || l.id}>
                            <td onClick={() => openLeadModal(l)} style={{fontWeight:600, color:'var(--primary)', cursor:'pointer'}}>{l.name}</td>
                            {userRole === 'MANAGER' && <td style={{fontSize:'0.7rem', fontWeight:800, color:'#64748b'}}>{l.consultant || '—'}</td>}
                            <td><span className="badge" style={{background:'#dcfce7', color:'#166534', padding:'4px 8px', borderRadius:'4px', fontSize:'0.6rem', fontWeight:800}}>{l.status}</span></td>
                            <td>{l.lastCall?.split('-').reverse().join('/') || 'Hoje'}</td>
                            <td><button className="btn-editar" onClick={() => openLeadModal(l)}>Ver Ficha</button></td>
                          </tr>
                        ))}
                        {resultsLeads.length === 0 && (
                          <tr><td colSpan="4" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Nenhuma ligação registrada ainda.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card-section">
                  <div className="card-header" style={{background:'#fff7ed', color:'#9a3412'}}>
                    <i className="fa-solid fa-clock-rotate-left" style={{marginRight:'8px'}}></i> 
                    PRÓXIMOS RETORNOS AGENDADOS
                  </div>
                  <div className="table-wrap">
                    <table className="sys-table">
                      <thead>
                        <tr>
                          <th>Lead / Empresa</th>
                          {userRole === 'MANAGER' && <th>Consultor</th>}
                          <th>Status</th>
                          <th>Data de Retorno</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingFollowUps.map(l => (
                          <tr key={l._id || l.id}>
                            <td onClick={() => openLeadModal(l)} style={{fontWeight:600, color:'var(--primary)', cursor:'pointer'}}>{l.name}</td>
                            {userRole === 'MANAGER' && <td style={{fontSize:'0.7rem', fontWeight:800, color:'#64748b'}}>{l.consultant || '—'}</td>}
                            <td><span className="badge" style={{background:'#f1f5f9', color:'#475569', padding:'4px 8px', borderRadius:'4px', fontSize:'0.6rem', fontWeight:800}}>{l.status}</span></td>
                            <td style={{fontWeight:800, color: l.nextFollowUp < today ? '#be123c' : '#ef4444'}}>
                              {l.nextFollowUp.split('-').reverse().join('/')}
                              {l.nextFollowUp < today && <span style={{fontSize:'0.6rem', marginLeft:'5px', display:'block'}}>(ATRASADO)</span>}
                            </td>
                            <td>
                              <div style={{display:'flex', gap:'8px'}}>
                                <button className="btn-save" style={{padding:'6px 12px', fontSize:'0.65rem', background:'#10b981', border:'none', color:'#fff', borderRadius:'4px', fontWeight:700, cursor:'pointer'}} onClick={() => {
                                  if(window.confirm(`Confirmar sucesso com ${l.name}?`)) {
                                    saveLead({...l, status: 'Fechado', nextFollowUp: '', consultant: username});
                                    updateM(2, 1);
                                  }
                                }}>Sucesso</button>
                                <button className="btn-editar" style={{padding:'6px 12px', fontSize:'0.65rem', fontWeight:700}} onClick={() => openLeadModal(l)}>Reagendar</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pendingFollowUps.length === 0 && (
                          <tr><td colSpan="4" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Nenhum retorno agendado para os próximos dias.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SEMANAL */}
          {activeTab === 'semanal' && (() => {
            const rangeInfo = getRangeStats(selectedDate, endDate);
            return (
              <div className="content-panel active">
                {/* DEMONSTRATIVO DAS 4 SEMANAS */}
                <div className="card-section">
                  <div className="card-header"><i className="fa-solid fa-calendar-check" style={{marginRight:'8px'}}></i> DEMONSTRATIVO SEMANAL DE METAS</div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'15px', padding:'20px'}}>
                    {[1, 2, 3, 4].map(w => (
                      <div key={w} className="week-card-white">
                        <div className="week-card-header"><span>Semana {w}</span> <i className="fa-solid fa-calendar-day" style={{color:'#2563eb'}}></i></div>
                        <div className="week-card-row">
                          <div className="label"><i className="fa-solid fa-phone-slash" style={{color:'#be123c', marginRight:'5px'}}></i> Tentativas</div>
                          <div className="value">{stats.semanal['w'+w].t}</div>
                        </div>
                        <div className="week-card-row">
                          <div className="label"><i className="fa-solid fa-phone" style={{color:'#0d9488', marginRight:'5px'}}></i> Ligações</div>
                          <div className="value" style={{display:'flex', alignItems:'center', gap:'5px'}}>
                            <input 
                              type="number" 
                              className="value-input-inline" 
                              value={stats.semanal['w'+w].c} 
                              onChange={(e) => {
                                const diff = parseInt(e.target.value || 0) - stats.semanal['w'+w].c;
                                setStats(prev => {
                                  const ns = {...prev};
                                  ns.semanal['w'+w].c += diff;
                                  return ns;
                                });
                              }}
                              style={{width:'40px', background:'none', border:'none', fontWeight:800, color:'#0d9488', outline:'none', textAlign:'right'}}
                            /> / {(stats.weeklyGoals?.c || 120) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}
                          </div>
                        </div>
                        <div className="progress-bar-bg"><div className="progress-bar-fill" style={{width: `${Math.min((stats.semanal['w'+w].c / ((stats.weeklyGoals?.c || 120) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1))) * 100, 100)}%`, background:'#0d9488'}}></div></div>
                        <div className="week-card-row" style={{marginTop:'10px'}}>
                          <div className="label">🏢 Reuniões</div>
                          <div className="value" style={{display:'flex', alignItems:'center', gap:'5px'}}>
                            <input 
                              type="number" 
                              className="value-input-inline" 
                              value={stats.semanal['w'+w].m} 
                              onChange={(e) => {
                                const diff = parseInt(e.target.value || 0) - stats.semanal['w'+w].m;
                                setStats(prev => {
                                  const ns = {...prev};
                                  ns.semanal['w'+w].m += diff;
                                  return ns;
                                });
                              }}
                              style={{width:'30px', background:'none', border:'none', fontWeight:800, color:'#be123c', outline:'none', textAlign:'right'}}
                            /> / {(stats.weeklyGoals?.m || 6) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}
                          </div>
                        </div>
                        <div className="progress-bar-bg"><div className="progress-bar-fill" style={{width: `${Math.min((stats.semanal['w'+w].m / ((stats.weeklyGoals?.m || 6) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1))) * 100, 100)}%`, background:'#be123c'}}></div></div>
                        
                        <div className="week-card-row" style={{marginTop:'10px'}}>
                          <div className="label">🏆 Clientes</div>
                          <div className="value" style={{display:'flex', alignItems:'center', gap:'5px'}}>
                            <input 
                              type="number" 
                              className="value-input-inline" 
                              value={stats.semanal['w'+w].cl} 
                              onChange={(e) => {
                                const diff = parseInt(e.target.value || 0) - stats.semanal['w'+w].cl;
                                setStats(prev => {
                                  const ns = {...prev};
                                  ns.semanal['w'+w].cl += diff;
                                  return ns;
                                });
                              }}
                              style={{width:'30px', background:'none', border:'none', fontWeight:800, color:'#0891b2', outline:'none', textAlign:'right'}}
                            /> / {(stats.weeklyGoals?.cl || 2) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}
                          </div>
                        </div>
                        <div className="progress-bar-bg"><div className="progress-bar-fill" style={{width: `${Math.min((stats.semanal['w'+w].cl / ((stats.weeklyGoals?.cl || 2) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1))) * 100, 100)}%`, background:'#0891b2'}}></div></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-section" style={{marginTop:'10px'}}>
                  <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span><i className="fa-solid fa-calendar-week" style={{marginRight:'8px'}}></i> PERÍODO: {rangeInfo.range.start.split('-').reverse().join('/')} A {rangeInfo.range.end.split('-').reverse().join('/')}</span>
                    <button onClick={() => setShowCalendar(true)} style={{background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontWeight:'700', fontSize:'0.8rem'}}>
                      <i className="fa-solid fa-calendar-days" style={{marginRight:'5px'}}></i> Mudar Período
                    </button>
                  </div>
                </div>

                <div className="stat-grid" style={{marginTop:'10px'}}>
                  <div className="card-section">
                    <div className="card-header"><i className="fa-solid fa-chart-pie" style={{marginRight:'8px'}}></i> DISTRIBUIÇÃO DO PERÍODO</div>
                    <div style={{padding:'10px', flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}><canvas id="weeklyPieChart" style={{maxHeight:'150px'}}></canvas></div>
                    
                    <div className="card-header" style={{borderTop:'1px solid #eee', marginTop:'2px'}}>DETALHAMENTO DIÁRIO</div>
                    <div style={{padding:'5px 10px'}}>
                      <table className="sys-table" style={{fontSize:'0.65rem'}}>
                        <thead>
                          <tr><th>Dia</th><th>Data</th><th>Ligações</th><th>Meta</th><th>Progresso</th></tr>
                        </thead>
                        <tbody>
                          {rangeInfo.dailyBreakdown.map((day) => (
                            <tr key={day.date}>
                              <td>{day.label}</td>
                              <td>{day.date.split('-').reverse().join('/')}</td>
                              <td>{day.c}</td>
                              <td>{day.goal}</td>
                              <td>
                                <div className="progress-bar-bg" style={{height:'6px'}}><div className="progress-bar-fill" style={{width:`${Math.min((day.c/day.goal)*100,100)}%`, background: day.c >= day.goal ? '#10b981' : '#f59e0b'}}></div></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="colored-stats">
                    <div className="stat-card grey">
                      <h4>TENTATIVAS</h4>
                      <div className="value">{rangeInfo.total.t}</div>
                      <i className="fa-solid fa-phone-slash"></i>
                    </div>
                    <div className="stat-card teal">
                      <h4>LIGAÇÕES</h4>
                      <div className="value-container">
                        <input 
                          type="number" 
                          className="value-input-period" 
                          value={rangeInfo.total.c} 
                          onChange={(e) => updatePeriodValue('c', e.target.value, rangeInfo.total.c)}
                          onFocus={(e) => e.target.select()}
                          style={{width:'80px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'4px', color:'#fff', fontWeight:800, textAlign:'center', outline:'none', fontSize:'1.8rem'}}
                        />
                        <span className="goal-separator">/</span>
                        <span className="goal-value" style={{fontSize:'1.2rem', opacity:0.8}}>{(stats.weeklyGoals?.c || 120) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}</span>
                      </div>
                      <i className="fa-solid fa-phone"></i>
                    </div>
                    <div className="stat-card red">
                      <h4>REUNIÕES</h4>
                      <div className="value-container">
                        <input 
                          type="number" 
                          className="value-input-period" 
                          value={rangeInfo.total.m} 
                          onChange={(e) => updatePeriodValue('m', e.target.value, rangeInfo.total.m)}
                          onFocus={(e) => e.target.select()}
                          style={{width:'60px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'4px', color:'#fff', fontWeight:800, textAlign:'center', outline:'none', fontSize:'1.8rem'}}
                        />
                        <span className="goal-separator">/</span>
                        <span className="goal-value" style={{fontSize:'1.2rem', opacity:0.8}}>{(stats.weeklyGoals?.m || 6) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}</span>
                      </div>
                      <i className="fa-solid fa-handshake"></i>
                    </div>
                    <div className="stat-card cyan">
                      <h4>CLIENTES</h4>
                      <div className="value-container">
                        <input 
                          type="number" 
                          className="value-input-period" 
                          value={rangeInfo.total.cl} 
                          onChange={(e) => updatePeriodValue('cl', e.target.value, rangeInfo.total.cl)}
                          onFocus={(e) => e.target.select()}
                          style={{width:'60px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'4px', color:'#fff', fontWeight:800, textAlign:'center', outline:'none', fontSize:'1.8rem'}}
                        />
                        <span className="goal-separator">/</span>
                        <span className="goal-value" style={{fontSize:'1.2rem', opacity:0.8}}>{(stats.weeklyGoals?.cl || 2) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}</span>
                      </div>
                      <i className="fa-solid fa-trophy"></i>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* MENSAL */}
          {activeTab === 'mensal' && (() => {
            const mStats = getMonthStats(selectedMonth);
            const monthsNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            return (
              <div className="content-panel active">
                <div className="card-section">
                  <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 15px'}}>
                    <span style={{fontSize:'0.9rem', fontWeight:800}}><i className="fa-solid fa-calendar-check" style={{marginRight:'10px', color:'var(--primary)'}}></i> MÊS DE REFERÊNCIA: {monthsNames[selectedMonth].toUpperCase()} / 2026</span>
                    <button 
                      onClick={() => setShowMonthModal(true)} 
                      style={{
                        background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', 
                        cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <i className="fa-solid fa-calendar-days"></i> SELECIONAR MÊS
                    </button>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginTop:'10px'}}>
                  <div className="stat-card grey">
                    <h4>TOTAL TENTATIVAS</h4>
                    <div className="value">{mStats.total.t}</div>
                    <div className="goal-info">Contatos não atendidos</div>
                    <i className="fa-solid fa-phone-slash"></i>
                  </div>
                  <div className="stat-card teal">
                    <h4>TOTAL LIGAÇÕES</h4>
                    <div className="value-container">
                      <input 
                        type="number" 
                        className="value-input-period" 
                        value={mStats.total.c} 
                        onChange={(e) => updatePeriodValue('c', e.target.value, mStats.total.c)}
                        onFocus={(e) => e.target.select()}
                        style={{width:'90px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'4px', color:'#fff', fontWeight:800, textAlign:'center', outline:'none', fontSize:'1.8rem'}}
                      />
                      <span className="goal-separator">/</span>
                      <span className="goal-value" style={{fontSize:'1.2rem', opacity:0.8}}>{(stats.monthlyGoals?.c || 480) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}</span>
                    </div>
                    <div className="goal-info">Meta mensal</div>
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div className="stat-card red">
                    <h4>TOTAL REUNIÕES</h4>
                    <div className="value-container">
                      <input 
                        type="number" 
                        className="value-input-period" 
                        value={mStats.total.m} 
                        onChange={(e) => updatePeriodValue('m', e.target.value, mStats.total.m)}
                        onFocus={(e) => e.target.select()}
                        style={{width:'60px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'4px', color:'#fff', fontWeight:800, textAlign:'center', outline:'none', fontSize:'1.8rem'}}
                      />
                      <span className="goal-separator">/</span>
                      <span className="goal-value" style={{fontSize:'1.2rem', opacity:0.8}}>{(stats.monthlyGoals?.m || 24) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}</span>
                    </div>
                    <div className="goal-info">Meta mensal</div>
                    <i className="fa-solid fa-handshake"></i>
                  </div>
                  <div className="stat-card cyan">
                    <h4>TOTAL CLIENTES</h4>
                    <div className="value-container">
                      <input 
                        type="number" 
                        className="value-input-period" 
                        value={mStats.total.cl} 
                        onChange={(e) => updatePeriodValue('cl', e.target.value, mStats.total.cl)}
                        onFocus={(e) => e.target.select()}
                        style={{width:'60px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'4px', color:'#fff', fontWeight:800, textAlign:'center', outline:'none', fontSize:'1.8rem'}}
                      />
                      <span className="goal-separator">/</span>
                      <span className="goal-value" style={{fontSize:'1.2rem', opacity:0.8}}>{(stats.monthlyGoals?.cl || 8) * (userRole === 'MANAGER' && !filterUserId ? 2 : 1)}</span>
                    </div>
                    <div className="goal-info">Meta mensal</div>
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                </div>

                <div className="card-section" style={{marginTop:'15px', flex:1}}>
                  <div className="card-header"><i className="fa-solid fa-chart-line" style={{marginRight:'8px'}}></i> CURVA DE DESEMPENHO MENSAL VS METAS</div>
                  <div style={{padding:'20px', flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <canvas id="monthlyLineChart" style={{maxHeight:'320px'}}></canvas>
                  </div>
                </div>

                <div style={{display:'flex', gap:'15px', marginTop:'20px'}}>
                  <button 
                    onClick={() => { if(confirm("Deseja zerar tudo?")) { localStorage.clear(); window.location.reload(); } }}
                    style={{background:'#be123c', color:'#fff', border:'none', padding:'12px 25px', borderRadius:'8px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'10px'}}
                  >
                    <i className="fa-solid fa-trash-can"></i> Limpar Todos os Dados
                  </button>
                  <button 
                    onClick={() => {
                      setStats(prev => {
                        const newByDate = {...prev.byDate};
                        for(let i=1; i<=30; i++) {
                          const d = `2026-05-${i.toString().padStart(2,'0')}`;
                          newByDate[d] = { t: Math.floor(Math.random()*40), c: Math.floor(Math.random()*20), m: Math.floor(Math.random()*5), cl: Math.floor(Math.random()*2) };
                        }
                        return {...prev, byDate: newByDate};
                      });
                    }}
                    style={{background:'#0d9488', color:'#fff', border:'none', padding:'12px 25px', borderRadius:'8px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'10px'}}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Gerar Dados de Teste
                  </button>
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", "data_contacts.json");
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    style={{background:'#4f46e5', color:'#fff', border:'none', padding:'12px 25px', borderRadius:'8px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'10px'}}
                  >
                    <i className="fa-solid fa-file-export"></i> Exportar Base para data_contacts.js
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* MODAL CRM TELA CHEIA PREMIUM */}
      {selectedLead && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="left-crm-panel">
              <div className="giant-sticky-note-wrapper">
                <div className="giant-sticky-pin"></div>
                <textarea 
                  id="note-textarea"
                  className="giant-sticky-note-textarea" 
                  placeholder="O que conversamos hoje com este cliente?"
                ></textarea>
                <button 
                  className="btn-premium-save" 
                  style={{marginTop:'20px'}}
                  onClick={() => {
                    const el = document.getElementById('note-textarea');
                    const val = el.value;
                    if (!val.trim()) return;
                    
                    const newNote = { date: new Date().toLocaleString('pt-BR'), text: val };
                    const updatedLead = { 
                      ...selectedLead, 
                      history: [newNote, ...(selectedLead.history || [])] 
                    };
                    
                    setSelectedLead(updatedLead);
                    setLeads(prev => prev.map(l => (l._id && l._id === updatedLead._id) || (l.id === updatedLead.id) ? updatedLead : l));
                    
                    setSessionNoteAdded(true);
                    el.value = "";
                    
                    // Sincroniza imediatamente com o servidor
                    leadService.saveLead(updatedLead).catch(err => console.error("Erro ao salvar nota:", err));
                  }}
                >
                  SALVAR NO HISTÓRICO
                </button>
              </div>
              
              <div className="history-timeline">
                <h3 style={{fontSize:'0.8rem', fontWeight:800, color:'#475569', marginBottom:'15px'}}>HISTÓRICO DE INTERAÇÕES</h3>
                {(selectedLead.history || []).map((h, i) => (
                  <div 
                    key={i} 
                    className="history-card" 
                    style={{cursor:'pointer'}}
                    title="Clique para abrir e editar esta anotação"
                    onClick={() => setSelectedNoteIndex(i)}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <span>{h.date}</span>
                      <i className="fa-solid fa-expand" style={{fontSize:'0.7rem', color:'#94a3b8'}}></i>
                    </div>
                    <p style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{h.text}</p>
                  </div>
                ))}
                {(!selectedLead.history || selectedLead.history.length === 0) && (
                  <div style={{textAlign:'center', padding:'20px', color:'#94a3b8', fontSize:'0.8rem'}}>Nenhum histórico registrado ainda.</div>
                )}
              </div>
            </div>

            <div className="right-form-panel">
              <div className="modal-header">
                <h2>Ficha do Lead <span style={{color: 'var(--primary)', fontSize:'1rem', verticalAlign:'middle'}}>• {selectedLead.name}</span></h2>
                <button className="close-modal" onClick={() => setSelectedLead(null)}>&times;</button>
              </div>
              
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px'}}>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'8px', display:'block'}}>EMPRESA / INSTITUIÇÃO</label>
                  <input type="text" id="edit-name" defaultValue={selectedLead.name} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:600}} />
                </div>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'8px', display:'block'}}>CONTATO / TELEFONE</label>
                  <input type="text" id="edit-phone" defaultValue={selectedLead.phone} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:600}} />
                </div>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'8px', display:'block'}}>BAIRRO / REGIONAL</label>
                  <input type="text" id="edit-address" defaultValue={selectedLead.address} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:600}} />
                </div>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'8px', display:'block'}}>RESPONSÁVEL</label>
                  <input type="text" id="edit-resp" defaultValue={selectedLead.resp || ""} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:600}} />
                </div>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'8px', display:'block'}}>DATA ÚLTIMO CONTATO</label>
                  <input type="date" id="edit-lastcall" defaultValue={selectedLead.lastCall || ""} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:600}} />
                </div>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#be123c', marginBottom:'8px', display:'block'}}>AGENDAR RETORNO (DATA)</label>
                  <input type="date" id="edit-nextfollowup" defaultValue={selectedLead.nextFollowUp || ""} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:600, borderColor: '#be123c'}} />
                </div>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'8px', display:'block'}}>STATUS</label>
                  <select id="edit-status" defaultValue={selectedLead.status || "Pendente"} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:600, background:'#fff'}}>
                    <option>Pendente</option>
                    <option>Contatado</option>
                    <option>Reunião</option>
                    <option>Apresentação</option>
                    <option>Proposta</option>
                    <option>Fechado</option>
                    <option>Descartado</option>
                  </select>
                </div>
                <div className="form-group-modal">
                  <label style={{fontSize:'0.65rem', fontWeight:800, color:'#64748b', marginBottom:'8px', display:'block'}}>CONSULTOR RESPONSÁVEL</label>
                  <select id="edit-consultant" defaultValue={selectedLead.consultant || username} style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontWeight:800, background:'#f8fafc', color:'var(--primary)'}}>
                    <option value="felipe.possa">felipe.possa</option>
                    <option value="Joab.marques">Joab.marques</option>
                    <option value="Gessica.ogliari">Gessica.ogliari</option>
                  </select>
                </div>
              </div>

              <div style={{marginTop:'auto', display:'flex', justifyContent:'flex-end', gap:'15px', paddingTop:'25px'}}>
                <button className="btn-editar" style={{padding:'10px 20px', borderRadius:'8px', background:'#f1f5f9', border:'none', color:'#475569', fontWeight:700, fontSize:'0.75rem'}} onClick={() => setSelectedLead(null)}>Descartar Alterações</button>
                <button className="btn-premium-save" style={{width:'auto', padding:'10px 25px', fontSize:'0.8rem'}} onClick={() => {
                  const noteEl = document.getElementById('note-textarea');
                  const noteVal = noteEl ? noteEl.value.trim() : "";
                  
                  // Se for um lead NOVO, permite salvar sem anotação inicial (opcional)
                  // Se for um lead EXISTENTE, exige anotação ou que já tenha sido adicionada na sessão
                  if (selectedLead.id !== 'new' && !noteVal && !sessionNoteAdded) {
                    alert("⚠️ Por favor, escreva uma breve anotação no post-it amarelo justificando a alteração.");
                    if(noteEl) noteEl.focus();
                    return;
                  }

                  const data = {
                    id: selectedLead.id,
                    _id: selectedLead._id, // Garantir que o ID do MongoDB seja passado
                    name: document.getElementById('edit-name').value,
                    phone: document.getElementById('edit-phone').value,
                    address: document.getElementById('edit-address').value,
                    resp: document.getElementById('edit-resp').value,
                    lastCall: getLocalDate(), // Força a data local de hoje ao salvar
                    nextFollowUp: document.getElementById('edit-nextfollowup').value,
                    status: document.getElementById('edit-status').value,
                    consultant: document.getElementById('edit-consultant').value
                  };

                  // Se houver nota, adiciona ao histórico do lead
                  if (noteVal) {
                    const newNote = { date: new Date().toLocaleString('pt-BR'), text: noteVal };
                    data.history = [newNote, ...(selectedLead.history || [])];
                    if(noteEl) noteEl.value = "";
                  } else {
                    data.history = selectedLead.history || [];
                  }

                  saveLead(data);
                }}>Confirmar e Salvar Dados</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CALENDARIO */}
      {showCalendar && (
        <CalendarModal 
          selectedDate={selectedDate} 
          endDate={endDate}
          onSelect={(start, end) => {
            setSelectedDate(start);
            setEndDate(end || start);
            setShowCalendar(false);
          }} 
          onClose={() => setShowCalendar(false)} 
        />
      )}
      {showMonthModal && (
        <MonthPickerModal
          selectedMonth={selectedMonth}
          onSelect={setSelectedMonth}
          onClose={() => setShowMonthModal(false)}
        />
      )}
      
      {/* MODAL DE ANOTAÇÃO EXPANDIDA */}
      {selectedNoteIndex !== null && selectedLead && (
        <div className="modal-overlay" style={{zIndex: 10001}}>
          <div className="modal-container" style={{maxWidth: '700px', height: '600px', flexDirection: 'column', padding: '30px', position: 'relative'}}>
            <button className="close-modal" style={{position: 'absolute', top: '20px', right: '20px'}} onClick={() => setSelectedNoteIndex(null)}>&times;</button>
            <h2 style={{fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '20px'}}>
              <i className="fa-solid fa-note-sticky" style={{marginRight: '10px', color: '#f59e0b'}}></i>
              Anotação de {selectedLead.history[selectedNoteIndex].date}
            </h2>
            <textarea 
              id="edit-note-textarea"
              defaultValue={selectedLead.history[selectedNoteIndex].text}
              style={{
                flex: 1,
                width: '100%',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#fff9c4',
                fontSize: '1.1rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.6',
                color: '#422006'
              }}
            ></textarea>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px'}}>
              <button className="btn-editar" style={{marginRight: 'auto', background: '#fee2e2', color: '#991b1b'}} onClick={() => {
                if(window.confirm("Tem certeza que deseja apagar esta anotação permanentemente?")) {
                  const updatedHistory = selectedLead.history.filter((_, index) => index !== selectedNoteIndex);
                  const updatedLead = { ...selectedLead, history: updatedHistory };
                  
                  setSelectedLead(updatedLead);
                  setLeads(prev => prev.map(l => (l._id && l._id === updatedLead._id) || (l.id === updatedLead.id) ? updatedLead : l));
                  
                  // Sincroniza com o servidor
                  leadService.saveLead(updatedLead).catch(err => console.error("Erro ao apagar nota:", err));
                  
                  setSelectedNoteIndex(null);
                }
              }}>Apagar Permanente</button>
              <button className="btn-editar" onClick={() => setSelectedNoteIndex(null)}>Cancelar</button>
              <button 
                className="btn-premium-save" 
                style={{width: 'auto', padding: '12px 30px'}}
                onClick={() => {
                  const newText = document.getElementById('edit-note-textarea').value;
                  const updatedHistory = [...selectedLead.history];
                  updatedHistory[selectedNoteIndex] = { ...updatedHistory[selectedNoteIndex], text: newText };
                  const updatedLead = { ...selectedLead, history: updatedHistory };
                  
                  setSelectedLead(updatedLead);
                  setLeads(prev => prev.map(l => (l._id && l._id === updatedLead._id) || (l.id === updatedLead.id) ? updatedLead : l));
                  
                  // Sincroniza com o servidor
                  leadService.saveLead(updatedLead).catch(err => console.error("Erro ao editar nota:", err));
                  
                  setSelectedNoteIndex(null);
                }}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}
</div>
  );
}

const MonthPickerModal = ({ selectedMonth, onSelect, onClose }) => {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 10000}}>
      <div className="modal-container" style={{
        maxWidth: '550px', 
        height: 'auto', 
        padding: '40px', 
        borderRadius: '24px', 
        background: '#fff', 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '40px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        alignItems: 'center'
      }}>
        {/* BOTÃO FECHAR ALINHADO NO CANTO SUPERIOR DIREITO */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '24px', right: '24px', 
            background: 'none', border: 'none', fontSize: '1.8rem', 
            color: '#94a3b8', cursor: 'pointer', transition: '0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1
          }}
          onMouseEnter={(e) => e.target.style.color = '#ef4444'}
          onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
        >
          &times;
        </button>
        
        {/* LADO ESQUERDO: TÍTULO E ÍCONE */}
        <div style={{flex: '0 0 180px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
           <div style={{width: '60px', height: '60px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <i className="fa-solid fa-calendar-days" style={{fontSize: '2rem', color: '#2563eb'}}></i>
           </div>
           <h2 style={{fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, margin: 0}}>
             Selecionar<br/><span style={{color: '#2563eb'}}>Mês</span>
           </h2>
           <p style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 500}}>Escolha o período para análise de indicadores.</p>
        </div>

        {/* LADO DIREITO: GRADE DE MESES CIRCULARES */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', flex: 1}}>
          {months.map((m, i) => (
            <button 
              key={m} 
              onClick={() => { onSelect(i); onClose(); }}
              style={{
                width: '65px', 
                height: '65px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.8rem', 
                fontWeight: 800, 
                border: '2px solid #f1f5f9',
                cursor: 'pointer',
                transition: '0.3s',
                background: selectedMonth === i ? '#2563eb' : '#fff',
                color: selectedMonth === i ? '#fff' : '#475569',
                boxShadow: selectedMonth === i ? '0 10px 15px -3px rgba(37, 99, 235, 0.4)' : 'none'
              }}
              onMouseEnter={(e) => { if(selectedMonth !== i) e.target.style.borderColor = '#2563eb'; }}
              onMouseLeave={(e) => { if(selectedMonth !== i) e.target.style.borderColor = '#f1f5f9'; }}
            >
              {m.substring(0,3).toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CalendarModal = ({ selectedDate, endDate, onSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate).getMonth());
  const [rangeStart, setRangeStart] = useState(selectedDate);
  const [rangeEnd, setRangeEnd] = useState(endDate);
  const daysInMonth = (m) => new Date(2026, m + 1, 0).getDate();
  const startDay = (m) => new Date(2026, m, 1).getDay();
  
  const handleDayClick = (dStr) => {
    if (!rangeStart || (rangeStart && rangeEnd)) { setRangeStart(dStr); setRangeEnd(null); }
    else {
      const s = new Date(rangeStart + 'T12:00:00'); const e = new Date(dStr + 'T12:00:00');
      if (Math.round(Math.abs(e - s) / 86400000) + 1 > 5) return alert("Máximo 5 dias!");
      if (e < s) { setRangeStart(dStr); setRangeEnd(rangeStart); onSelect(dStr, rangeStart); }
      else { setRangeEnd(dStr); onSelect(rangeStart, dStr); }
    }
  };

  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 10000}}>
      <div className="modal-container" style={{
        maxWidth: '400px', height: 'auto', padding: '30px', borderRadius: '24px', 
        background: '#fff', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* BOTÃO FECHAR */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '24px', right: '24px', 
            background: 'none', border: 'none', fontSize: '1.8rem', 
            color: '#94a3b8', cursor: 'pointer', transition: '0.2s',
            lineHeight: 1
          }}
          onMouseEnter={(e) => e.target.style.color = '#ef4444'}
          onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
        >
          &times;
        </button>

        <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px'}}>
          <div style={{width: '45px', height: '45px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <i className="fa-solid fa-calendar-days" style={{fontSize: '1.2rem', color: '#2563eb'}}></i>
          </div>
          <h2 style={{fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0}}>Selecionar Período</h2>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '10px 15px', borderRadius: '12px'}}>
          <button onClick={() => setCurrentMonth(m => m > 0 ? m - 1 : 11)} style={{background:'none', border:'none', cursor:'pointer', color:'#2563eb', fontWeight:800}}>&lt;</button>
          <span style={{fontWeight: 800, color: '#1e293b', fontSize: '0.9rem'}}>{["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][currentMonth]} 2026</span>
          <button onClick={() => setCurrentMonth(m => m < 11 ? m + 1 : 0)} style={{background:'none', border:'none', cursor:'pointer', color:'#2563eb', fontWeight:800}}>&gt;</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px', textAlign:'center'}}>
          {['D','S','T','Q','Q','S','S'].map(d => <div key={d} style={{fontSize:'0.7rem', fontWeight:800, color: '#94a3b8', paddingBottom: '5px'}}>{d}</div>)}
          {Array(startDay(currentMonth)).fill(null).map((_, i) => <div key={i}></div>)}
          {Array.from({length: daysInMonth(currentMonth)}, (_, i) => {
            const d = i + 1; const dStr = `2026-${(currentMonth+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            const active = (rangeStart && !rangeEnd && dStr === rangeStart) || (rangeStart && rangeEnd && dStr >= rangeStart && dStr <= rangeEnd);
            const isToday = dStr === new Date().toISOString().split('T')[0];
            return (
              <div 
                key={d} 
                onClick={() => handleDayClick(dStr)} 
                style={{
                  padding:'10px 0', 
                  cursor:'pointer', 
                  background: active ? '#2563eb' : (isToday ? '#eff6ff' : '#fff'), 
                  color: active ? '#fff' : (isToday ? '#2563eb' : '#475569'), 
                  borderRadius:'8px',
                  fontSize: '0.85rem',
                  fontWeight: (active || isToday) ? 800 : 500,
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => { if(!active) e.target.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { if(!active) e.target.style.background = isToday ? '#eff6ff' : '#fff'; }}
              >
                {d}
              </div>
            );
          })}
        </div>
        
        <div style={{marginTop: '25px', padding: '15px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center'}}>
           <p style={{margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600}}>
             {rangeStart && rangeEnd ? `Período: ${rangeStart.split('-').reverse().join('/')} até ${rangeEnd.split('-').reverse().join('/')}` : (rangeStart ? 'Selecione a data final' : 'Selecione a data inicial')}
           </p>
        </div>
      </div>
    </div>
  );
};

export default App;
