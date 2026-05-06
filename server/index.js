const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

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

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// AUTH
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const lowerUser = (username || '').toLowerCase().trim();
    console.log(`🔑 Tentativa de login para: ${lowerUser}`);
    
    // Busca insensível a maiúsculas/minúsculas
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${lowerUser}$`, 'i') } 
    });

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
    const hashedPasswordFelipe = await require('bcryptjs').hash('luvi123', 10);
    const hashedPasswordOthers = await require('bcryptjs').hash('123456789', 10);

    const felipe = await User.findOneAndUpdate(
      { username: 'felipe.possa' },
      { username: 'felipe.possa', password: hashedPasswordFelipe, role: 'MANAGER' },
      { upsert: true, new: true }
    );
    
    const joab = await User.findOneAndUpdate(
      { username: 'joab.marques' },
      { username: 'joab.marques', password: hashedPasswordOthers, role: 'USER' },
      { upsert: true, new: true }
    );

    const gessica = await User.findOneAndUpdate(
      { username: 'gessica.ogliari' },
      { username: 'gessica.ogliari', password: hashedPasswordOthers, role: 'MANAGER' },
      { upsert: true, new: true }
    );

    console.log('🚀 Usuários verificados/criados!');

    // --- MIGRAÇÃO DE SEGURANÇA: RECONECTAR LEADS AOS NOVOS IDs ---
    const allUsers = await User.find({});
    for (const u of allUsers) {
      // Procura leads que tenham o nome deste consultor (mesmo que com maiúsculas no passado)
      const migrationResult = await Lead.updateMany(
        { consultant: { $regex: new RegExp(`^${u.username}$`, 'i') } },
        { $set: { userId: u._id, consultant: u.username } }
      );
      if (migrationResult.modifiedCount > 0) {
        console.log(`📦 Recuperados ${migrationResult.modifiedCount} leads para "${u.username}"`);
      }
    }

    // --- MIGRAÇÃO DE RESULTADOS: LIMPAR DUPLICADOS E UNIFICAR ---
    console.log('🧹 Iniciando limpeza de duplicados em Stats...');
    const allStats = await Stats.find({}).sort({ date: 1, userId: 1 });
    const seenStats = new Map();
    const toDelete = [];

    for (const s of allStats) {
      const key = `${s.date}_${s.userId}`;
      if (seenStats.has(key)) {
        const original = seenStats.get(key);
        // Soma os valores no original
        original.t = (original.t || 0) + (s.t || 0);
        original.c = (original.c || 0) + (s.c || 0);
        original.m = (original.m || 0) + (s.m || 0);
        original.cl = (original.cl || 0) + (s.cl || 0);
        if (s.goal) original.goal = s.goal;
        
        await original.save();
        toDelete.push(s._id);
      } else {
        seenStats.set(key, s);
      }
    }

    if (toDelete.length > 0) {
      await Stats.deleteMany({ _id: { $in: toDelete } });
      console.log(`✅ Removidos ${toDelete.length} registros duplicados de Stats.`);
    }

    console.log('✅ Faxina completa! Sistema unificado.');

    // Atribuir órfãos restantes ao felipe
    const orphanResult = await Lead.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: felipe._id, consultant: 'felipe.possa' } }
    );
    if (orphanResult.modifiedCount > 0) {
      console.log(`✅ Atribuídos ${orphanResult.modifiedCount} leads sem dono ao admin.`);
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
    const users = await User.find({ role: { $in: ['USER', 'MANAGER'] } }, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LEADS
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    // Gestão de leads compartilhada: todos veem todos os leads.
    // O que separa os usuários são os RESULTADOS (stats), não a visualização dos leads.
    let filter = {};
    if (req.user.role === 'MANAGER' && req.query.userId && req.query.userId !== '') {
      filter = { userId: req.query.userId };
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
    const { id } = req.params;
    const { name } = req.body;
    let lead;
    
    // 1. Tenta encontrar por _id (MongoDB)
    if (mongoose.Types.ObjectId.isValid(id)) {
      lead = await Lead.findById(id);
    }
    
    // 2. Se não encontrou por _id, tenta por ID numérico (legacy)
    if (!lead && req.body.id) {
      lead = await Lead.findOne({ id: req.body.id });
    }

    // 3. BLOQUEIO DE DUPLICIDADE POR NOME: 
    // Se o nome mudou ou se estamos criando um novo, checa se esse nome já existe em outro registro
    if (name) {
      const existingByName = await Lead.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: lead ? lead._id : null }
      });
      
      if (existingByName) {
        // Se já existe um lead com esse nome, unificamos nele em vez de criar duplicado
        Object.assign(existingByName, req.body);
        const saved = await existingByName.save();
        return res.json(saved);
      }
    }
    
    if (lead) {
      // Atualiza o existente
      Object.assign(lead, req.body);
      await lead.save();
    } else {
      // Cria novo se realmente não existir nada com esse ID nem com esse nome
      const data = { ...req.body };
      delete data._id;
      lead = new Lead(data);
      if (!lead.userId) lead.userId = req.user.id;
      await lead.save();
    }
    
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
    if (req.user.role === 'MANAGER' && (!req.query.userId || req.query.userId === '')) {
      // Visão Geral: Agregar todos os usuários por data
      const aggregatedStats = await Stats.aggregate([
        {
          $group: {
            _id: "$date",
            date: { $first: "$date" },
            t: { $sum: { $ifNull: ["$t", 0] } },
            c: { $sum: { $ifNull: ["$c", 0] } },
            m: { $sum: { $ifNull: ["$m", 0] } },
            cl: { $sum: { $ifNull: ["$cl", 0] } },
            goal: { $sum: { $ifNull: ["$goal", 30] } }
          }
        },
        { $sort: { date: 1 } }
      ]);
      return res.json(aggregatedStats || []);
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
  try {
    const { date, t, c, m, cl, goal, userId } = req.body;
    if (!date) return res.status(400).json({ error: 'Data é obrigatória' });

    const targetUserId = (req.user.role === 'MANAGER' && userId) ? userId : req.user.id;
    
    // Criar objeto de atualização apenas com campos que foram enviados
    const updateData = {};
    if (t !== undefined) updateData.t = t;
    if (c !== undefined) updateData.c = c;
    if (m !== undefined) updateData.m = m;
    if (cl !== undefined) updateData.cl = cl;
    if (goal !== undefined) updateData.goal = goal;

    const stat = await Stats.findOneAndUpdate(
      { date, userId: targetUserId },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
    
    // Data vinda do frontend ou fallback para SP
    const targetDate = req.query.date || new Date().toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}).split('/').reverse().join('-');
    
    const users = await User.find({ role: { $in: ['USER', 'MANAGER'] } });
    const teamData = await Promise.all(users.map(async (u) => {
      const s = await Stats.findOne({ userId: u._id, date: targetDate });
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

// SERVIR FRONTEND EM PRODUÇÃO (Caminho Robusto para Render/Local)
const possiblePaths = [
  path.join(__dirname, '../React/dist'),
  path.join(__dirname, 'React', 'dist'),
  path.join(process.cwd(), 'React', 'dist'),
  path.join(process.cwd(), 'dist')
];

let frontendPath = '';
for (const p of possiblePaths) {
  if (require('fs').existsSync(p)) {
    frontendPath = p;
    console.log(`✅ Pasta do site encontrada em: ${p}`);
    break;
  }
}

if (!frontendPath) {
  console.error('❌ ERRO CRÍTICO: Pasta "dist" do site não foi encontrada em nenhum dos caminhos possíveis!');
  console.error('Certifique-se de que o comando de build (npm run build) foi executado com sucesso.');
}

if (frontendPath) {
  app.use(express.static(frontendPath));
} else {
  console.warn('⚠️ AVISO: O servidor está rodando sem os arquivos do site. Execute "npm run build" na pasta React.');
}

app.get(/.*/, (req, res) => {
  if (frontendPath) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(500).send('Erro: O servidor está ativo, mas o site não foi construído. Rode o comando de build.');
  }
});

app.listen(PORT, () => {
  console.log(`
=========================================
🚀 SERVIDOR LUVI CRM ATIVO!
🌍 Porta: ${PORT}
📂 Site: ${frontendPath || 'NÃO ENCONTRADO'}
=========================================
  `);
});
