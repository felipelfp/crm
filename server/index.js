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

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ Login autorizado');
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('❌ Erro no servidor durante login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Função para garantir que o admin exista
const ensureAdmin = async () => {
  try {
    const admin = await User.findOne({ username: 'felipe.possa' });
    if (!admin) {
      await User.create({ username: 'felipe.possa', password: 'luvi123' });
      console.log('🚀 Usuário admin "felipe.possa" criado com sucesso!');
    }
  } catch (err) {
    console.error('⚠️ Erro ao criar admin:', err);
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

// LEADS
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();
    res.json(savedLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    const filter = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
    const updatedLead = await Lead.findOneAndUpdate(filter, req.body, { new: true });
    res.json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const filter = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
    await Lead.findOneAndDelete(filter);
    res.json({ message: 'Lead removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STATS (Indicadores)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await Stats.find();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stats', async (req, res) => {
  const { date, t, c, m, cl, goal } = req.body;
  try {
    const stat = await Stats.findOneAndUpdate(
      { date },
      { $set: { t, c, m, cl, goal } },
      { upsert: true, new: true }
    );
    res.json(stat);
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
