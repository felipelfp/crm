
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function resetTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));
    const Stats = mongoose.model('Stats', new mongoose.Schema({}, { strict: false }));

    // 1. Limpar Stats de hoje (06/05/2026)
    const today = '2026-05-06';
    const statsResult = await Stats.deleteMany({ date: today });
    console.log(`✅ ${statsResult.deletedCount} registros de estatísticas de hoje foram removidos.`);

    // 2. Limpar Histórico e Status de Leads tocados hoje
    // Vamos resetar QUALQUER lead que tenha lastCall ou nextFollowUp de hoje ou futuro (teste)
    const leadsToReset = await Lead.find({
      $or: [
        { lastCall: { $exists: true, $ne: "" } },
        { nextFollowUp: { $exists: true, $ne: "" } }
      ]
    });

    for (const lead of leadsToReset) {
      await Lead.updateOne(
        { _id: lead._id },
        { 
          $set: { 
            status: 'Pendente',
            lastCall: "",
            nextFollowUp: "",
            history: [] // Limpa os comentários de teste
          } 
        }
      );
    }
    console.log(`✅ ${leadsToReset.length} leads foram resetados para o estado inicial (Gestão).`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no reset:', err);
    process.exit(1);
  }
}

resetTestData();
