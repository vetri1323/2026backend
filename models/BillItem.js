const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: function() {
      // Only require serviceId if category is not provided (service billing mode)
      return !this.category;
    }
  },
  subServiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubService',
    required: function() {
      // Only require subServiceId if subCategory is not provided (service billing mode)
      return !this.subCategory;
    }
  },
  serviceName: {
    type: String,
    required: function() {
      // Only require serviceName if category is not provided (service billing mode)
      return !this.category;
    },
    trim: true
  },
  subServiceName: {
    type: String,
    required: function() {
      // Only require subServiceName if subCategory is not provided (service billing mode)
      return !this.subCategory;
    },
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // New stock detail fields
  category: {
    type: String,
    trim: true,
    default: ''
  },
  subCategory: {
    type: String,
    trim: true,
    default: ''
  },
  totalStock: {
    type: Number,
    min: 0,
    default: 0
  },
  // New counting fields
  sheetCount: {
    type: Number,
    min: 0,
    default: 0
  },
  wastCount: {
    type: Number,
    min: 0,
    default: 0
  },
  totalCount: {
    type: Number,
    min: 0,
    default: 0
  },
  text: {
    type: String,
    trim: true,
    default: ''
  },
  gst: {
    type: Number,
    min: 0,
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

// Calculate amount before saving
billItemSchema.pre('save', function(next) {
  this.amount = this.quantity * this.unitPrice;
  this.updatedAt = Date.now();
  
  // Validation: ensure either service fields OR stock fields are provided
  const hasServiceFields = this.serviceId && this.subServiceId && this.serviceName && this.subServiceName;
  const hasStockFields = this.category && this.subCategory;
  
  if (!hasServiceFields && !hasStockFields) {
    return next(new Error('Either service fields (serviceId, subServiceId, serviceName, subServiceName) OR stock fields (category, subCategory) must be provided'));
  }
  
  next();
});

module.exports = mongoose.model('BillItem', billItemSchema);
