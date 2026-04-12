const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  currentCount: {
    type: Number,
    required: true,
    min: 0
  },
  previousCount: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrints: {
    type: Number,
    required: true,
    min: 0
  },
  remarks: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
readingSchema.index({ machineId: 1, date: -1 });

module.exports = mongoose.model('Reading', readingSchema);
