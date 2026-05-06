
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const Stats = require('./server/models/Stats');
const User = require('./server/models/User');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const joab = await User.findOne({ username: 'joab.marques' });
    if (!joab) {
      console.log('❌ Usuário joab.marques não encontrado');
      return;
    }
    console.log(`👤 Joab ID: ${joab._id}`);

    const stats = await Stats.find({ userId: joab._id });
    console.log(`📊 Stats encontrados para Joab (${stats.length}):`);
    stats.forEach(s => {
      console.log(`   Data: ${s.date} | T: ${s.t} | C: ${s.c} | M: ${s.m} | CL: ${s.cl}`);
    });

    const allStats = await Stats.find({}).limit(5);
    console.log('\n📊 Amostra de outros stats no banco:');
    allStats.forEach(s => {
      console.log(`   User: ${s.userId} | Data: ${s.date} | T: ${s.t} | C: ${s.c}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

inspect();
