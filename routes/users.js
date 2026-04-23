const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find user by credentials
    const user = await User.findByCredentials(username, password);

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Private (Admin only)
router.post('/auth/register', auth, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      pin,
      fullName,
      phone,
      role = 'staff',
      permissions
    } = req.body;

    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can create new users'
      });
    }

    // Validate input
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      pin,
      fullName,
      phone,
      role,
      permissions: permissions || {
        dashboard: true,
        customers: true,
        reminders: true,
        billing: role === 'admin',
        settings: role === 'admin',
        machines: role === 'admin',
        reports: role === 'admin'
      }
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'User creation failed'
    });
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      pin,
      fullName,
      phone,
      role = 'staff',
      permissions
    } = req.body;

    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can create new users'
      });
    }

    // Validate input
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      pin,
      fullName,
      phone,
      role,
      permissions: permissions || {
        dashboard: true,
        customers: true,
        reminders: true,
        billing: role === 'admin',
        settings: role === 'admin',
        machines: role === 'admin',
        reports: role === 'admin'
      }
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'User creation failed'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can view all users'
      });
    }

    const users = await User.find({})
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own user)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if requesting user is admin or requesting own profile
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own user)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if requesting user is admin or updating own profile
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Non-admin users can only update limited fields
    if (req.user.role !== 'admin') {
      const allowedFields = ['fullName', 'phone', 'pin'];
      const updateKeys = Object.keys(updates);
      const hasInvalidFields = updateKeys.some(key => !allowedFields.includes(key));
      
      if (hasInvalidFields) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your name, phone, and PIN'
        });
      }
    }

    // Don't allow password update through this endpoint
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can delete users'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.userId === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
    });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Update user status
// @access  Private (Admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can update user status'
      });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (active/inactive)'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.userId === id && status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user status'
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow sensitive fields to be updated
    delete updates.password;
    delete updates.role;
    delete updates.status;
    delete updates.permissions;
    delete updates.emailVerified;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new passwords'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
});

// @route   POST /api/users/init-default-admin
// @desc    Create default admin user if none exists
// @access  Public (for initial setup)
router.post('/init-default-admin', async (req, res) => {
  try {
    const adminUser = await User.createDefaultAdmin();
    
    res.json({
      success: true,
      message: 'Default admin user created/verified',
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Create default admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create default admin'
    });
  }
});

module.exports = router;
