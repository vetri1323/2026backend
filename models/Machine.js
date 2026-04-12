const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    enum: ['Brother', 'Canon', 'Epson', 'HP', 'Konica Minolta', 'Kyocera', 'Ricoh', 'TVS', 'Xerox', 'Others']
  },
  modelNumber: {
    type: String,
    required: true,
    trim: true
  },
  installationDate: {
    type: Date,
    required: true
  },
  serviceCenterDetails: {
    type: String,
    trim: true
  },
  warrantyStartDate: {
    type: Date
  },
  warrantyExpiryDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Under Maintenance'],
    default: 'Active'
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

machineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Machine', machineSchema);
