const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  pin: {
    type: String,
    required: false,
    minlength: 4,
    maxlength: 4,
    match: [/^\d{4}$/, 'PIN must be exactly 4 digits']
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'staff', 'manager'],
    default: 'staff'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  permissions: {
    dashboard: {
      type: Boolean,
      default: true
    },
    customers: {
      type: Boolean,
      default: true
    },
    reminders: {
      type: Boolean,
      default: true
    },
    billing: {
      type: Boolean,
      default: false
    },
    settings: {
      type: Boolean,
      default: false
    },
    machines: {
      type: Boolean,
      default: false
    },
    reports: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(username, password) {
  const user = await this.findOne({
    $or: [
      { username: username },
      { email: username }
    ],
    status: 'active'
  });

  if (!user) {
    throw new Error('Unable to login - user not found');
  }

  if (user.isLocked) {
    throw new Error('Account locked due to too many failed login attempts');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Unable to login - invalid credentials');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 },
      $set: { lastLogin: new Date() }
    });
  } else {
    await user.updateOne({
      $set: { lastLogin: new Date() }
    });
  }

  return user;
};

// Static method to create default admin user
userSchema.statics.createDefaultAdmin = async function() {
  const existingAdmin = await this.findOne({ role: 'admin' });
  if (existingAdmin) {
    return existingAdmin;
  }

  const defaultAdmin = new this({
    username: 'admin',
    email: 'admin@ganesa.com',
    password: 'admin123',
    pin: '1234',
    fullName: 'System Administrator',
    phone: '',
    role: 'admin',
    status: 'active',
    permissions: {
      dashboard: true,
      customers: true,
      reminders: true,
      billing: true,
      settings: true,
      machines: true,
      reports: true
    },
    emailVerified: true
  });

  return await defaultAdmin.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
