const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Lead = require('./models/Lead');
const Stats = require('./models/Stats');

async function reset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB para limpeza final.');

    // Apagar todos os leads
    const leadDel = await Lead.deleteMany({});
    console.log(`🧹 Removidos ${leadDel.deletedCount} leads de teste.`);

    // Apagar todos os resultados/estatísticas
    const statsDel = await Stats.deleteMany({});
    console.log(`🧹 Removidos ${statsDel.deletedCount} registros de estatísticas.`);

    console.log('✨ BANCO DE DADOS ZERADO COM SUCESSO! Pronto para uso oficial.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no reset:', err);
    process.exit(1);
  }
}

reset();
