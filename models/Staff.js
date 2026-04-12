const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Technician', 'Senior Technician', 'Service Manager', 'Senior Service Engineer', 'Service Coordinator', 'Field Engineer'],
    default: 'Technician'
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Service', 'Sales', 'Support', 'Administration'],
    default: 'Service'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  assignedCustomers: {
    type: Number,
    default: 0,
    min: 0
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

staffSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add a method to get formatted staff info
staffSchema.methods.getFormattedInfo = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    department: this.department,
    isActive: this.isActive,
    joinDate: this.joinDate,
    assignedCustomers: this.assignedCustomers,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Staff', staffSchema);
