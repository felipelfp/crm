const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Lead = require('./models/Lead');

async function deduplicate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🧹 Conectado ao banco para limpeza...');

    const leads = await Lead.find({}).sort({ createdAt: -1 });
    const seen = new Set();
    const toDelete = [];

    for (const l of leads) {
      if (!l.name) continue;
      const cleanName = l.name.toUpperCase().trim();
      
      if (seen.has(cleanName)) {
        toDelete.push(l._id);
      } else {
        seen.add(cleanName);
      }
    }

    if (toDelete.length > 0) {
      console.log(`🗑️ Apagando ${toDelete.length} duplicados...`);
      await Lead.deleteMany({ _id: { $in: toDelete } });
      console.log('✅ Duplicados removidos com sucesso!');
    } else {
      console.log('✨ Não foram encontrados nomes repetidos.');
    }

  } catch (err) {
    console.error('❌ Erro na limpeza:', err);
  } finally {
    mongoose.connection.close();
  }
}

deduplicate();
