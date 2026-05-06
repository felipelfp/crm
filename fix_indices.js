
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function fixIndices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const Stats = mongoose.model('Stats', new mongoose.Schema({}, { strict: false }));
    
    console.log('🔍 Listando índices atuais...');
    const indexes = await Stats.collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Procura por um índice que seja apenas 'date' e seja 'unique'
    const badIndex = indexes.find(idx => 
      idx.key.date === 1 && Object.keys(idx.key).length === 1 && idx.unique
    );

    if (badIndex) {
      console.log(`⚠️ Removendo índice incorreto: ${badIndex.name}`);
      await Stats.collection.dropIndex(badIndex.name);
      console.log('✅ Índice removido com sucesso!');
    } else {
      console.log('ℹ️ Nenhum índice "date" único isolado foi encontrado.');
      // Por precaução, vamos dropar o date_1 se ele estiver causando o erro
      try {
        console.log(' tentando dropar date_1 por precaução...');
        await Stats.collection.dropIndex('date_1');
        console.log('✅ date_1 removido.');
      } catch (e) {
        console.log('ℹ️ date_1 não existia ou não pôde ser removido.');
      }
    }

    console.log('🚀 Índices limpos. O Mongoose recriará o índice composto (date + userId) automaticamente ao reiniciar o servidor.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

fixIndices();
