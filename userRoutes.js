const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get all users (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Create new user (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, pin, role, fullName, phone, status, permissions } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      pin,
      role: role || 'staff',
      fullName,
      phone,
      status: status || 'active',
      permissions: permissions || {
        dashboard: true,
        customers: true,
        reminders: true,
        billing: false,
        settings: false
      }
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, pin, role, fullName, phone, status, permissions } = req.body;
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email/username is being changed and if it already exists
    if (email !== user.email || username !== user.username) {
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }],
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email or username already exists' });
      }
    }
    
    // Update user fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.pin = pin || user.pin;
    user.role = role || user.role;
    user.fullName = fullName || user.fullName;
    user.phone = phone || user.phone;
    user.status = status || user.status;
    user.permissions = permissions || user.permissions;
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Change user status (admin only)
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = status;
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// Reset user password (admin only)
router.patch('/:id/reset-password', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Get user statistics (admin only)
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const staffUsers = await User.countDocuments({ role: 'staff' });
    
    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admin: adminUsers,
      staff: staffUsers
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
});

// Search users (admin only)
router.get('/search', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ]
    }).select('-password').sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get users by role (admin only)
router.get('/role/:role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: req.params.role }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ message: 'Error fetching users by role' });
  }
});

// Create admin user (special endpoint for initial setup)
router.post('/admin', async (req, res) => {
  try {
    const { username, email, password, pin, fullName, phone } = req.body;
    
    // Check if admin already exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create admin user
    const adminUser = new User({
      username,
      email,
      password: hashedPassword,
      pin,
      role: 'admin',
      fullName,
      phone,
      status: 'active',
      permissions: {
        dashboard: true,
        customers: true,
        reminders: true,
        billing: true,
        settings: true
      }
    });
    
    await adminUser.save();
    
    // Remove password from response
    const userResponse = adminUser.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Error creating admin user' });
  }
});

// Get all admin users (admin only)
router.get('/admins', verifyToken, requireAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Error fetching admin users' });
  }
});

// Bulk operations (admin only)
router.post('/bulk', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Users array is required' });
    }
    
    const createdUsers = [];
    
    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [{ email: userData.email }, { username: userData.username }] 
        });
        
        if (!existingUser) {
          // Hash password
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(userData.password, salt);
          
          // Create new user
          const newUser = new User({
            ...userData,
            password: hashedPassword
          });
          
          await newUser.save();
          
          // Remove password from response
          const userResponse = newUser.toObject();
          delete userResponse.password;
          
          createdUsers.push(userResponse);
        }
      } catch (error) {
        console.error('Error creating user in bulk:', error);
      }
    }
    
    res.status(201).json(createdUsers);
  } catch (error) {
    console.error('Error in bulk user creation:', error);
    res.status(500).json({ message: 'Error in bulk user creation' });
  }
});

// Bulk delete (admin only)
router.delete('/bulk', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }
    
    // Check if trying to delete all admins
    const adminCount = await User.countDocuments({ role: 'admin' });
    const adminsToDelete = await User.countDocuments({ 
      _id: { $in: ids },
      role: 'admin'
    });
    
    if (adminsToDelete >= adminCount) {
      return res.status(400).json({ message: 'Cannot delete all admin users' });
    }
    
    await User.deleteMany({ _id: { $in: ids } });
    
    res.json({ message: 'Users deleted successfully' });
  } catch (error) {
    console.error('Error in bulk user deletion:', error);
    res.status(500).json({ message: 'Error in bulk user deletion' });
  }
});

module.exports = router;
