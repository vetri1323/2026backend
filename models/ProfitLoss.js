const mongoose = require('mongoose');

const profitLossSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true,
    enum: ['monthly', 'quarterly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  revenue: {
    total: {
      type: Number,
      default: 0
    },
    breakdown: [{
      source: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      description: String
    }]
  },
  expenses: {
    total: {
      type: Number,
      default: 0
    },
    breakdown: [{
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        required: true
      },
      categoryName: String,
      amount: {
        type: Number,
        required: true
      },
      subcategories: [{
        subCategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ExpenseSubCategory'
        },
        subcategoryName: String,
        amount: Number
      }]
    }]
  },
  grossProfit: {
    type: Number,
    default: 0
  },
  netProfit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'finalized'],
    default: 'draft'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
profitLossSchema.index({ period: 1, startDate: 1, endDate: 1 });
profitLossSchema.index({ startDate: 1, endDate: 1 });

// Pre-save middleware to calculate profit metrics
profitLossSchema.pre('save', function(next) {
  // Calculate gross profit (revenue - direct expenses)
  this.grossProfit = this.revenue.total - this.expenses.total;
  
  // Calculate net profit (same as gross profit for now, can be enhanced with other expenses)
  this.netProfit = this.grossProfit;
  
  // Calculate profit margin
  this.profitMargin = this.revenue.total > 0 ? (this.netProfit / this.revenue.total) * 100 : 0;
  
  next();
});

module.exports = mongoose.model('ProfitLoss', profitLossSchema);
