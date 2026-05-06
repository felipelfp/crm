
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));
    const categories = await Lead.distinct('category');
    const counts = {};
    for (const cat of categories) {
      counts[cat] = await Lead.countDocuments({ category: cat });
    }
    console.log('--- CATEGORIAS NO BANCO ---');
    console.log(JSON.stringify(counts, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkCategories();
