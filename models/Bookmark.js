const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  favicon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

bookmarkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add index for better search performance
bookmarkSchema.index({ serviceName: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
