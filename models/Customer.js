const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  cellNo: {
    type: String,
    required: true,
    trim: true
  },
  emailId: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  refer: {
    type: String,
    trim: true
  },
  aadhaarNumber: {
    type: String,
    trim: true
  },
  panCardNumber: {
    type: String,
    trim: true
  },
  rationCardNumber: {
    type: String,
    trim: true
  },
  voterIdNumber: {
    type: String,
    trim: true
  },
  otherIdDetails: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    trim: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  subService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubService'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reminders: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    customerId: {
      type: String,
      required: true
    },
    customerName: {
      type: String,
      required: true
    },
    cellNo: {
      type: String,
      required: true
    },
    customerBirthday: {
      type: String
    },
    registerDate: {
      type: String
    },
    services: {
      type: String
    },
    subServices: {
      type: String
    },
    applicationNo: {
      type: String
    },
    serviceStatus: {
      type: String,
      enum: ['applied', 'pending', 'completed'],
      default: 'applied'
    },
    duration: {
      type: String
    },
    reminderDate: {
      type: String
    },
    notes: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
