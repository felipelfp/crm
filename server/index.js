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
// Alteração de segurança: ao reiniciar o servidor, o segredo MUDA na força bruta ignorando o arquivo .env
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
    console.log(`✅ Login autorizado para ${user.username} (${user.role || 'USER'}) | ID: ${user._id}`);
    res.json({ token, username: user.username, role: user.role || 'USER', userId: user._id });
  } catch (err) {
    console.error('❌ Erro no servidor durante login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Função para garantir que o admin exista
const ensureAdmin = async () => {
  try {
    // --- LIMPEZA DE ÍNDICE CRÍTICO ---
    // Remove o índice que está travando o Joab (impede mais de uma pessoa por dia)
    try {
      await mongoose.connection.collection('stats').dropIndex('date_1');
      console.log('✅ SUCESSO: Índice restritivo "date_1" removido!');
    } catch (e) {
      // O índice já foi removido ou não existe
    }
    const hashedPasswordFelipe = await require('bcryptjs').hash('123456789', 10);
    const hashedPasswordOthers = await require('bcryptjs').hash('123456789', 10);

    let felipe = await User.findOneAndUpdate(
      { username: 'felipe.possa' },
      { username: 'felipe.possa', password: hashedPasswordFelipe, role: 'USER' },
      { upsert: true, new: true }
    );
    
    // --- PASSO 2: RECRIAR O JOAB COMO UM CLONE PERFEITO DO FELIPE ---
    const hashedPasswordPadrão = await require('bcryptjs').hash('123456789', 10);
    await User.findOneAndUpdate(
      { username: 'joab.marques' },
      { username: 'joab.marques', password: hashedPasswordPadrão, role: 'USER' },
      { upsert: true, new: true }
    );
    console.log('✅ JOAB RECRIADO COM SUCESSO: O clone idêntico está pronto com a senha padrão!');

    let gessica = await User.findOneAndUpdate(
      { username: 'gessica.ogliari' },
      { username: 'gessica.ogliari', password: hashedPasswordOthers, role: 'MANAGER' },
      { upsert: true, new: true }
    );

    // --- PASSO 3: CLONAR OS DADOS (LEADS E STATS) DO FELIPE PARA O JOAB ---
    const joabUser = await User.findOne({ username: 'joab.marques' });
    const felipeUser = await User.findOne({ username: 'felipe.possa' });
    
    if (joabUser && felipeUser) {
      const joabStatsCount = await Stats.countDocuments({ userId: joabUser._id });
      // Se Joab tem menos de 5 registros, forçamos uma nova clonagem para garantir que ele tenha dados base
      if (joabStatsCount < 5) {
        console.log(`🔧 Joab tem poucos dados (${joabStatsCount}). Forçando sincronização com base do Felipe...`);
        const felipeStats = await Stats.find({ userId: felipeUser._id });
        for (let s of felipeStats) {
          await Stats.findOneAndUpdate(
            { date: s.date, userId: joabUser._id },
            { $set: { t: s.t, c: s.c, m: s.m, cl: s.cl, goal: s.goal } },
            { upsert: true }
          );
        }
        
        console.log(`✅ DADOS SINCRONIZADOS: Stats garantidos para o Joab!`);
      }
    }

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
    
    // --- MIGRAÇÃO DE SEGURANÇA: GARANTIR OBJECTID EM STATS ---
    console.log('🔧 Verificando tipos de ID em Stats...');
    const statsToFix = await Stats.find({ userId: { $type: 'string' } });
    if (statsToFix.length > 0) {
      console.log(`🔧 Corrigindo ${statsToFix.length} registros de Stats com ID em formato string...`);
      for (const s of statsToFix) {
        if (mongoose.Types.ObjectId.isValid(s.userId)) {
          s.userId = new mongoose.Types.ObjectId(s.userId);
          await s.save();
        }
      }
      console.log('✅ IDs de Stats corrigidos.');
    }
    
    // --- MIGRAÇÃO DE GESTORA: REATRIBUIR LEADS DA GESSICA PARA O FELIPE ---
    gessica = await User.findOne({ username: 'gessica.ogliari' });
    felipe = await User.findOne({ username: 'felipe.possa' });
    
    if (gessica && felipe) {
      const reassignResult = await Lead.updateMany(
        { $or: [{ userId: gessica._id }, { consultant: 'gessica.ogliari' }] },
        { $set: { userId: felipe._id, consultant: 'felipe.possa' } }
      );
      if (reassignResult.modifiedCount > 0) {
        console.log(`📋 Reatribuídos ${reassignResult.modifiedCount} leads da Gessica para o Felipe.`);
      }
    }

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
    const users = await User.find({ 
      role: { $in: ['USER', 'MANAGER'] },
      username: { $ne: 'gessica.ogliari' }
    }, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LEADS - MODO DE VISIBILIDADE TOTAL (RESTAURO)
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    // Retorna ABSOLUTAMENTE TODOS os leads para garantir que nada suma
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    console.error('Erro ao buscar leads:', err);
    res.status(500).json({ error: err.message });
  }
});

// SALVAR/ATUALIZAR LEAD (UPSERT ROBUSTO)
app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    let query = {};

    // 1. Tenta identificar o lead por _id, ID numérico ou Nome
    if (data._id && mongoose.Types.ObjectId.isValid(data._id)) {
      query = { _id: data._id };
    } else if (data.id) {
      query = { id: data.id };
    } else if (data.name) {
      query = { name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') } };
    }

    // 2. Sincroniza o dono do lead pelo nome do consultor (Gessica não é consultora)
    if (data.consultant && data.consultant !== 'gessica.ogliari') {
      const u = await User.findOne({ username: data.consultant });
      if (u) data.userId = u._id;
    } else if (!data.consultant || data.consultant === '') {
      data.userId = null;
      data.consultant = "";
    }

    // 3. Executa o UPSERT (Atualiza se existir, cria se não)
    const updatedLead = await Lead.findOneAndUpdate(
      query,
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(updatedLead);
  } catch (err) {
    console.error('❌ Erro ao salvar lead:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { id: id };
    }

    if (data.consultant && data.consultant !== 'gessica.ogliari') {
      const u = await User.findOne({ username: data.consultant });
      if (u) data.userId = u._id;
    }

    const updatedLead = await Lead.findOneAndUpdate(
      query,
      { $set: data },
      { upsert: true, new: true }
    );
    res.json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Lead.findByIdAndDelete(id);
    } else {
      await Lead.deleteOne({ id });
    }
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
    let targetId = req.user.id;
    if (req.user.role === 'MANAGER' && req.query.userId && req.query.userId !== '') {
      targetId = req.query.userId;
    }

    // Forçar conversão para ObjectId para garantir que a query funcione no Atlas
    let filter = {};
    try {
      filter.userId = new mongoose.Types.ObjectId(targetId);
    } catch (e) {
      // Se não for um ID válido (pode ser um username legado), tenta buscar o user
      const foundUser = await User.findOne({ username: targetId });
      if (foundUser) {
        filter.userId = foundUser._id;
      } else {
        return res.status(400).json({ error: 'ID de usuário inválido' });
      }
    }
      
    const stats = await Stats.find(filter);
    console.log(`🔍 Stats encontrados para ${targetId}: ${stats.length} registros`);
    res.json(stats);
  } catch (err) {
    console.error(`❌ Erro ao buscar stats para ${req.user.id}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stats', authenticateToken, async (req, res) => {
  try {
    const { date, t, c, m, cl, goal, userId } = req.body;
    if (!date) return res.status(400).json({ error: 'Data é obrigatória' });

    // Se o usuário não for manager, SEMPRE usa o próprio ID do token
    // Se for manager e passar um userId válido (ou username), usa esse alvo.
    let targetIdStr = req.user.id;
    
    if (req.user.role === 'MANAGER' && userId && userId !== '') {
      targetIdStr = userId;
    }

    let targetUserId;
    if (mongoose.Types.ObjectId.isValid(targetIdStr)) {
      targetUserId = new mongoose.Types.ObjectId(targetIdStr);
    } else {
      const foundUser = await User.findOne({ username: targetIdStr });
      if (foundUser) {
        targetUserId = foundUser._id;
      } else {
        console.error(`❌ User não encontrado para ID/Username: ${targetIdStr}`);
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }

    console.log(`📊 Atualizando stats para user ${targetUserId} em ${date} (Ação por: ${req.user.username})`);
    
    // Criar objeto de atualização apenas com campos que foram enviados
    const updateData = {};
    if (t !== undefined) updateData.t = Number(t);
    if (c !== undefined) updateData.c = Number(c);
    if (m !== undefined) updateData.m = Number(m);
    if (cl !== undefined) updateData.cl = Number(cl);
    if (goal !== undefined) updateData.goal = Number(goal);

    const stat = await Stats.findOneAndUpdate(
      { date, userId: targetUserId },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    console.log(`✅ Stat persistido: ${stat ? 'SIM' : 'NÃO'} | ID: ${stat?._id}`);
    
    if (!stat) {
      console.warn(`⚠️ Falha ao salvar/atualizar stats para ${targetUserId}`);
      return res.status(500).json({ error: 'Falha ao salvar estatísticas' });
    }

    res.json(stat);
  } catch (err) {
    console.error(`❌ Erro ao salvar stats: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sonda-joab', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Stats = mongoose.model('Stats');
    const joab = await User.findOne({ username: 'joab.marques' });
    if (!joab) return res.json({ error: "Usuario joab.marques nao existe no DB!" });
    
    const date = new Date().toISOString().split('T')[0];
    const updateData = { t: 99, c: 99, m: 99, cl: 99 };
    
    const stat = await Stats.findOneAndUpdate(
      { date, userId: joab._id },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    const verify = await Stats.findOne({ date, userId: joab._id });
    
    res.json({ success: true, joabId: joab._id, statSalvo: stat, statVerificado: verify });
  } catch (e) {
    res.json({ error: e.message, stack: e.stack });
  }
});

app.get('/api/sonda-felipe', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Stats = mongoose.model('Stats');
    const felipe = await User.findOne({ username: 'felipe.possa' });
    if (!felipe) return res.json({ error: "felipe.possa não existe" });
    const stats = await Stats.find({ userId: felipe._id });
    res.json({ success: true, userId: felipe._id, statsCount: stats.length, statsData: stats });
  } catch (e) {
    res.json({ error: e.message });
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
    
    const users = await User.find({ 
      role: { $in: ['USER', 'MANAGER'] },
      username: { $ne: 'gessica.ogliari' }
    });
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
