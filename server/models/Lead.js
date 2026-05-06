const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  id: String,
  phone: String,
  address: String,
  resp: String,
  status: { type: String, default: 'Pendente' },
  category: { type: String, default: 'SERVIÇOS' },
  lastCall: String,
  nextFollowUp: String,
  notes: String,
  consultant: String,
  lastContact: String,
  history: [{
    date: String,
    text: String
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

LeadSchema.index({ name: 1 });
LeadSchema.index({ userId: 1, category: 1, status: 1 });

module.exports = mongoose.model('Lead', LeadSchema);
