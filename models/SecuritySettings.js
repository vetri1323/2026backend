const mongoose = require('mongoose');

const SecuritySettingsSchema = new mongoose.Schema({
  // PIN Security
  pin: {
    type: String,
    required: false,
    select: false // Don't include in queries by default for security
  },
  pinCreatedAt: {
    type: Date,
    default: null
  },
  pinLastChanged: {
    type: Date,
    default: null
  },
  
  // PIN Lockout Tracking
  pinAttempts: {
    type: Number,
    default: 0
  },
  pinLockTime: {
    type: Date,
    default: null
  },
  
  // Security Configuration
  pinRequired: {
    type: Boolean,
    default: false
  },
  autoLockMinutes: {
    type: Number,
    default: 15 // Auto-lock after 15 minutes of inactivity
  },
  maxAttempts: {
    type: Number,
    default: 3 // Maximum failed attempts before lockout
  },
  lockoutDurationMinutes: {
    type: Number,
    default: 15 // Lockout duration in minutes
  },
  
  // Session Management
  lastActivity: {
    type: Date,
    default: Date.now
  },
  sessionTimeoutMinutes: {
    type: Number,
    default: 30 // Session timeout in minutes
  },
  
  // Additional Security Features
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  emailNotifications: {
    type: Boolean,
    default: false
  },
  
  // Audit Log
  securityLog: [{
    action: {
      type: String,
      enum: ['PIN_CREATED', 'PIN_CHANGED', 'PIN_REMOVED', 'PIN_VERIFIED', 'FAILED_ATTEMPT', 'LOCKOUT', 'UNLOCK', 'SETTINGS_UPDATED'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for efficient queries
SecuritySettingsSchema.index({ createdAt: -1 });
SecuritySettingsSchema.index({ 'securityLog.timestamp': -1 });

// Static method to get or create security settings
SecuritySettingsSchema.statics.getOrCreate = async function() {
  let settings = await this.findOne().sort({ createdAt: -1 });
  
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  
  return settings;
};

// Instance method to log security events
SecuritySettingsSchema.methods.logSecurityEvent = function(action, details = {}, ipAddress = null, userAgent = null) {
  this.securityLog.push({
    action,
    timestamp: new Date(),
    ipAddress,
    userAgent,
    details
  });
  
  // Keep only last 100 log entries to prevent bloat
  if (this.securityLog.length > 100) {
    this.securityLog = this.securityLog.slice(-100);
  }
  
  return this.save();
};

// Instance method to check if PIN is locked
SecuritySettingsSchema.methods.isPinLocked = function() {
  if (!this.pinLockTime) return false;
  
  const lockEndTime = new Date(this.pinLockTime.getTime() + this.lockoutDurationMinutes * 60 * 1000);
  return new Date() < lockEndTime;
};

// Instance method to get remaining lock time in minutes
SecuritySettingsSchema.methods.getLockTimeRemaining = function() {
  if (!this.pinLockTime) return 0;
  
  const lockEndTime = new Date(this.pinLockTime.getTime() + this.lockoutDurationMinutes * 60 * 1000);
  const remaining = Math.ceil((lockEndTime - new Date()) / 1000 / 60);
  
  return Math.max(0, remaining);
};

// Instance method to handle failed PIN attempt
SecuritySettingsSchema.methods.handleFailedAttempt = function(ipAddress = null, userAgent = null) {
  this.pinAttempts += 1;
  
  if (this.pinAttempts >= this.maxAttempts) {
    this.pinLockTime = new Date();
    this.logSecurityEvent('LOCKOUT', {
      attempts: this.pinAttempts,
      lockDuration: this.lockoutDurationMinutes
    }, ipAddress, userAgent);
  } else {
    this.logSecurityEvent('FAILED_ATTEMPT', {
      attempt: this.pinAttempts,
      remainingAttempts: this.maxAttempts - this.pinAttempts
    }, ipAddress, userAgent);
  }
  
  return this.save();
};

// Instance method to reset failed attempts
SecuritySettingsSchema.methods.resetFailedAttempts = function() {
  this.pinAttempts = 0;
  this.pinLockTime = null;
  return this.save();
};

// Instance method to verify PIN
SecuritySettingsSchema.methods.verifyPin = function(inputPin) {
  if (this.isPinLocked()) {
    return { success: false, error: 'PIN is locked' };
  }
  
  if (!this.pin) {
    return { success: false, error: 'No PIN is set' };
  }
  
  if (inputPin === this.pin) {
    this.resetFailedAttempts();
    this.lastActivity = new Date();
    this.logSecurityEvent('PIN_VERIFIED');
    return { success: true };
  } else {
    this.handleFailedAttempt();
    const remaining = this.maxAttempts - this.pinAttempts;
    const error = this.pinAttempts >= this.maxAttempts 
      ? `Too many failed attempts. PIN locked for ${this.lockoutDurationMinutes} minutes.`
      : `Incorrect PIN. ${remaining} attempts remaining.`;
    
    return { success: false, error };
  }
};

// Pre-save middleware to hash PIN
SecuritySettingsSchema.pre('save', async function(next) {
  if (this.isModified('pin') && this.pin) {
    // Simple hashing for demonstration - in production, use bcrypt
    const crypto = require('crypto');
    this.pin = crypto.createHash('sha256').update(this.pin).digest('hex');
  }
  next();
});

// Method to compare PIN
SecuritySettingsSchema.methods.comparePin = function(inputPin) {
  if (!this.pin) return false;
  
  const crypto = require('crypto');
  const hashedInput = crypto.createHash('sha256').update(inputPin).digest('hex');
  return this.pin === hashedInput;
};

module.exports = mongoose.model('SecuritySettings', SecuritySettingsSchema);
