
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({});
    console.log('--- USUÁRIOS NO BANCO ---');
    users.forEach(u => console.log(`- ${u.username} [${u.role}] ID: ${u._id}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
listUsers();
