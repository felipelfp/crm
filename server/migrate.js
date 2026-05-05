require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luvi_crm';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado para migração');

    // Create main user if not exists
    const existing = await User.findOne({ username: 'felipe.possa' });
    if (!existing) {
      const newUser = new User({
        username: 'felipe.possa',
        password: '123456789'
      });
      await newUser.save();
      console.log('✅ Usuário felipe.possa criado com sucesso!');
    } else {
      console.log('ℹ️ Usuário felipe.possa já existe.');
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erro na migração:', err);
  }
}

seed();
