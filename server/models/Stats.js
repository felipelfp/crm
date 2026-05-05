const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format YYYY-MM-DD
  t: { type: Number, default: 0 }, // Tentativas
  c: { type: Number, default: 0 }, // Conexões/Ligações
  m: { type: Number, default: 0 }, // Reuniões
  cl: { type: Number, default: 0 }, // Clientes
  goal: { type: Number } // Meta customizada para o dia
});

module.exports = mongoose.model('Stats', StatsSchema);
