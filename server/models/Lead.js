const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  address: String,
  resp: String,
  status: { type: String, default: 'Pendente' },
  category: { type: String, default: 'SERVIÇOS' },
  lastCall: String,
  nextFollowUp: String,
  notes: String,
  history: [{
    date: String,
    text: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
