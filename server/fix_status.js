const mongoose = require('mongoose');
const Lead = require('./models/Lead');

async function fixStatus() {
  try {
    const uri = 'mongodb://felipe008lucas:Fe535356%40@ac-yr0nywr-shard-00-00.lqvzxgu.mongodb.net:27017,ac-yr0nywr-shard-00-01.lqvzxgu.mongodb.net:27017,ac-yr0nywr-shard-00-02.lqvzxgu.mongodb.net:27017/luvi_crm?ssl=true&replicaSet=atlas-13s3l3-shard-0&authSource=admin&appName=Usuarios';
    await mongoose.connect(uri);
    
    // Atualiza QUALQUER lead sem status para Pendente
    const res = await Lead.updateMany(
      { status: { $exists: false } }, 
      { $set: { status: 'Pendente' } }
    );
    
    // Também garante que os de Alimentício e Facilities estejam Pendentes
    const res2 = await Lead.updateMany(
      { category: { $in: ['ALIMENTÍCIO', 'FACILITIES'] }, status: { $ne: 'Pendente' }, lastCall: { $exists: false } },
      { $set: { status: 'Pendente' } }
    );

    console.log(`✅ Leads corrigidos: ${res.modifiedCount + res2.modifiedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

fixStatus();
