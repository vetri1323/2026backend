const mongoose = require('mongoose');

const generalCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['general', 'expense', 'service'],
    default: 'general'
  },
  subcategories: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
generalCategorySchema.index({ name: 1, type: 1 });
generalCategorySchema.index({ type: 1 });
generalCategorySchema.index({ isActive: 1 });

// Virtual for subcategory count
generalCategorySchema.virtual('subcategoryCount').get(function() {
  return this.subcategories.length;
});

// Static methods
generalCategorySchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true });
};

generalCategorySchema.statics.getGeneralCategories = function() {
  return this.find({ type: 'general', isActive: true });
};

generalCategorySchema.statics.getExpenseCategories = function() {
  return this.find({ type: 'expense', isActive: true });
};

generalCategorySchema.statics.getServiceCategories = function() {
  return this.find({ type: 'service', isActive: true });
};

module.exports = mongoose.model('GeneralCategory', generalCategorySchema);
