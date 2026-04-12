const mongoose = require('mongoose');

const stockItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Paper', 'Ink', 'Lamination', 'Binding', 'Printing Plates', 'Chemicals', 'Tools', 'Packaging']
  },
  subCategory: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStock: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  restock: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'units'
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  supplier: {
    type: String,
    default: ''
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
stockItemSchema.index({ category: 1, subCategory: 1 });
stockItemSchema.index({ isActive: 1 });
stockItemSchema.index({ currentStock: 1, minStock: 1 });

// Virtual for stock status
stockItemSchema.virtual('stockStatus').get(function() {
  const current = this.currentStock;
  const min = this.minStock;
  
  if (current <= min * 0.5) return 'critical';
  if (current <= min) return 'low';
  if (current >= min * 3) return 'high';
  return 'normal';
});

// Static methods for stock analysis
stockItemSchema.statics.getLowStockItems = function() {
  return this.find({ currentStock: { $lte: mongoose.Types.Decimal128('$$this.minStock') } });
};

stockItemSchema.statics.getCriticalItems = function() {
  return this.find({ 
    $expr: { $lte: ['$currentStock', { $multiply: ['$minStock', 0.5] }] }
  });
};

stockItemSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$currentStock' },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$currentStock', '$minStock'] }, 1, 0]
          }
        },
        criticalItems: {
          $sum: {
            $cond: [{ $lte: ['$currentStock', { $multiply: ['$minStock', 0.5] }] }, 1, 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('StockItem', stockItemSchema);
