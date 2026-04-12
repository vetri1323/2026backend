const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  serviceDate: {
    type: Date,
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Head Cleaning', 'Ink Reset', 'General Service', 'Parts Replacement', 'Calibration', 'Other']
  },
  technicianName: {
    type: String,
    required: true,
    trim: true
  },
  nextServiceDate: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    min: 0
  },
  currentCount: {
    type: Number,
    min: 0
  },
  nextReminderCount: {
    type: Number,
    min: 0
  },
  nextReminderDate: {
    type: Date
  },
  serviceCount: {
    type: Number,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
maintenanceSchema.index({ machineId: 1, serviceDate: -1 });
maintenanceSchema.index({ nextServiceDate: 1 });
maintenanceSchema.index({ nextReminderDate: 1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
