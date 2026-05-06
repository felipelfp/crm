const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  id: String, // Campo para compatibilidade com IDs locais/numéricos
  phone: String,
  address: String,
  resp: String,
  status: { type: String, default: 'Pendente' },
  category: { type: String, default: 'SERVIÇOS' },
  lastCall: String,
  nextFollowUp: String,
  notes: String,
  consultant: String, // CAMPO ADICIONADO PARA SALVAR QUEM FEZ A LIGAÇÃO
  lastContact: String, // CAMPO ADICIONADO PARA DATA DE RESULTADOS
  history: [{
    date: String,
    text: String
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
