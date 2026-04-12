const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerAddress: {
    type: String,
    required: true,
    trim: true
  },
  billDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  serviceCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'credit_card', 'bank_transfer', 'other'],
    default: 'cash'
  },
  customerType: {
    type: String,
    enum: ['cash', 'credit'],
    default: 'cash'
  },
  transactionNo: {
    type: String,
    trim: true
  },
  upiId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
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

billSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Bill', billSchema);
