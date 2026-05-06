const mongoose = require('mongoose');
const Lead = require('./models/Lead');

async function finalRelease() {
  try {
    const uri = 'mongodb://felipe008lucas:Fe535356%40@ac-yr0nywr-shard-00-00.lqvzxgu.mongodb.net:27017,ac-yr0nywr-shard-00-01.lqvzxgu.mongodb.net:27017,ac-yr0nywr-shard-00-02.lqvzxgu.mongodb.net:27017/luvi_crm?ssl=true&replicaSet=atlas-13s3l3-shard-0&authSource=admin&appName=Usuarios';
    await mongoose.connect(uri);
    
    // REMOVE o userId de TODOS os leads que estão Pendentes
    // Isso os torna "Base Comum" (Shared)
    const res = await Lead.updateMany(
      { status: 'Pendente' }, 
      { $unset: { userId: "" } }
    );
    
    console.log(`✅ SUCESSO! ${res.modifiedCount} leads liberados para a base comum.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

finalRelease();
