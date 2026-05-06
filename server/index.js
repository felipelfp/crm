require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const Lead = require('./models/Lead');
const Stats = require('./models/Stats');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'luvi_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERRO: MONGODB_URI não encontrada! Verifique o Environment no Render.');
}

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acesso negado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// AUTH
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log(` Tentativa de login: ${username}`);
    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role || 'USER' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    console.log(`✅ Login autorizado para ${user.username} (${user.role || 'USER'})`);
    res.json({ token, username: user.username, role: user.role || 'USER' });
  } catch (err) {
    console.error('❌ Erro no servidor durante login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Função para garantir que o admin exista
const ensureAdmin = async () => {
  try {
    // Criar Felipe Possa se não existir
    let felipe = await User.findOne({ username: 'felipe.possa' });
    if (!felipe) {
      felipe = await User.create({ username: 'felipe.possa', password: 'luvi123', role: 'USER' });
      console.log('🚀 Usuário admin "felipe.possa" criado!');
    }

    // Criar Joab Marques se não existir
    let joab = await User.findOne({ username: 'Joab.marques' });
    if (!joab) {
      await User.create({ username: 'Joab.marques', password: '123456789', role: 'USER' });
      console.log('🚀 Usuário "Joab.marques" criado!');
    }

    // Criar Gessica Ogliari (GESTORA)
    let gessica = await User.findOne({ username: 'Gessica.ogliari' });
    if (!gessica) {
      await User.create({ username: 'Gessica.ogliari', password: '123456789', role: 'MANAGER' });
      console.log('🚀 Usuária GESTORA "Gessica.ogliari" criada!');
    }

    // MIGRAR LEADS ANTIGOS (atribuir ao felipe se não tiverem userId)
    const result = await Lead.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: felipe._id } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Migrados ${result.modifiedCount} leads para felipe.possa`);
    }

  } catch (err) {
    console.error('⚠️ Erro ao configurar usuários:', err);
  }
};

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
    ensureAdmin();
  })
  .catch(err => {
    console.error('❌ Falha na conexão com o MongoDB:', err);
    process.exit(1);
  });

// USUÁRIOS (Apenas para Gestores)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Acesso negado' });
    const users = await User.find({ role: 'USER' }, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LEADS
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    let filter = { userId: req.user.id };
    if (req.user.role === 'MANAGER') {
      // Se tiver userId e não for vazio, filtra. Se estiver vazio ou ausente, traz tudo.
      filter = (req.query.userId && req.query.userId !== '') ? { userId: req.query.userId } : {};
    } else {
      // Para usuários comuns: Seus próprios leads OU leads sem dono (Base Comum)
      filter = { 
        $or: [
          { userId: req.user.id },
          { userId: { $exists: false } },
          { userId: null }
        ]
      };
    }
      
    const leads = await Lead.find(filter).populate('userId', 'username').sort({ createdAt: -1 });
    // Mapear para incluir o nome do responsável de forma simples
    const leadsWithUser = leads.map(l => ({
      ...l.toObject(),
      ownerName: l.userId?.username || 'Sistema'
    }));
    res.json(leadsWithUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    
    // Busca por nome em TODA a base (sem filtrar por userId) para permitir a 'troca de dono'
    let lead = await Lead.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    const leadData = { 
      ...req.body, 
      userId: req.user.id, 
      consultant: req.user.username 
    };

    if (lead) {
      // Se o lead já existe, o Joab vira o novo 'dono' ao salvar/ligar
      Object.assign(lead, leadData);
      const updatedLead = await lead.save();
      return res.json(updatedLead);
    }

    const newLead = new Lead(leadData);
    const savedLead = await newLead.save();
    res.json(savedLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const leadData = { ...req.body, consultant: req.user.username };
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id },
      leadData,
      { new: true }
    );
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const filter = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id, userId: req.user.id } 
      : { id: req.params.id, userId: req.user.id };
      
    await Lead.findOneAndDelete(filter);
    res.json({ message: 'Lead removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STATS (Indicadores)
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'MANAGER' && !req.query.userId) {
      // Visão Geral: Agregar todos os usuários por data
      const aggregatedStats = await Stats.aggregate([
        {
          $group: {
            _id: "$date",
            date: { $first: "$date" },
            t: { $sum: "$t" },
            c: { $sum: "$c" },
            m: { $sum: "$m" },
            cl: { $sum: "$cl" },
            goal: { $sum: "$goal" }
          }
        },
        { $sort: { date: 1 } }
      ]);
      return res.json(aggregatedStats);
    }
    
    // Visão Individual (Manager filtrado ou User comum)
    const filter = (req.user.role === 'MANAGER' && req.query.userId && req.query.userId !== '') 
      ? { userId: req.query.userId } 
      : { userId: req.user.id };
      
    const stats = await Stats.find(filter);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stats', authenticateToken, async (req, res) => {
  const { date, t, c, m, cl, goal } = req.body;
  try {
    const stat = await Stats.findOneAndUpdate(
      { date, userId: req.user.id },
      { $set: { t, c, m, cl, goal, userId: req.user.id } },
      { upsert: true, new: true }
    );
    res.json(stat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/team-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Acesso negado' });
    
    // Pegar data local de São Paulo para bater com o frontend
    const today = new Date().toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}).split('/').reverse().join('-');
    
    const users = await User.find({ role: 'USER' });
    const teamData = await Promise.all(users.map(async (u) => {
      const s = await Stats.findOne({ userId: u._id, date: today });
      return {
        userId: u._id,
        username: u.username,
        stats: s || { t: 0, c: 0, m: 0, cl: 0, goal: 30 }
      };
    }));
    
    res.json(teamData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SERVIR FRONTEND EM PRODUÇÃO
const frontendPath = path.join(__dirname, '../React/dist');
app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
