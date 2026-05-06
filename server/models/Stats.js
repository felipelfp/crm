const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  t: { type: Number, default: 0 },
  c: { type: Number, default: 0 },
  m: { type: Number, default: 0 },
  cl: { type: Number, default: 0 },
  goal: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }
});

StatsSchema.index({ date: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Stats', StatsSchema);
