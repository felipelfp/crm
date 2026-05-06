const mongoose = require('mongoose');
const Lead = require('./models/Lead');

async function checkCategories() {
  try {
    const uri = 'mongodb://felipe008lucas:Fe535356%40@ac-yr0nywr-shard-00-00.lqvzxgu.mongodb.net:27017,ac-yr0nywr-shard-00-01.lqvzxgu.mongodb.net:27017,ac-yr0nywr-shard-00-02.lqvzxgu.mongodb.net:27017/luvi_crm?ssl=true&replicaSet=atlas-13s3l3-shard-0&authSource=admin&appName=Usuarios';
    await mongoose.connect(uri);
    const counts = await Lead.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log('📊 Contagem por Categoria:', JSON.stringify(counts, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

checkCategories();
