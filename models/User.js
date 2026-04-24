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
    required: true,
    match: [/^\d{4}$/, 'PIN must be exactly 4 digits']
  },
  role: {
    type: String,
    enum: ['admin', 'staff'],
    default: 'staff'
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  status: {
    type: String,
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
    }
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare PIN method
userSchema.methods.comparePin = async function(candidatePin) {
  return candidatePin === this.pin;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Get user permissions as array
userSchema.methods.getPermissions = function() {
  const permissions = [];
  Object.keys(this.permissions.toObject()).forEach(key => {
    if (this.permissions[key]) {
      permissions.push(key);
    }
  });
  return permissions;
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Static method to create admin user
userSchema.statics.createAdmin = function(userData) {
  return this.create({
    ...userData,
    role: 'admin',
    permissions: {
      dashboard: true,
      customers: true,
      reminders: true,
      billing: true,
      settings: true
    }
  });
};

// Virtual for user profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    phone: this.phone,
    status: this.status,
    permissions: this.getPermissions(),
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
});

// Hide sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.pin;
  return user;
};

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
