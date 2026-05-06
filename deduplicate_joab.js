
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function deduplicateLeads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));
    
    console.log('🔍 Buscando duplicatas de Joab...');
    
    // Encontrar todos os leads do Joab
    const joabLeads = await Lead.find({ consultant: 'joab.marques' });
    let count = 0;

    for (const jLead of joabLeads) {
      // Verificar se existe um lead com o mesmo nome para o Felipe
      const felipeLead = await Lead.findOne({ 
        name: jLead.name, 
        consultant: 'felipe.possa' 
      });

      if (felipeLead) {
        // É uma duplicata exata de clonagem. Vamos apagar a do Joab.
        await Lead.deleteOne({ _id: jLead._id });
        count++;
      }
    }

    console.log(`✅ FAXINA CONCLUÍDA: ${count} leads duplicados do Joab foram removidos.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro na faxina:', err);
    process.exit(1);
  }
}

deduplicateLeads();
