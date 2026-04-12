const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const auth = require('../middleware/auth');

// Get all staff
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== STAFF API DEBUG ===');
    console.log('Fetching all staff...');
    console.log('Query parameters:', req.query);
    
    let query = {};
    
    // Filter by active status if specified
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    console.log('Query filter:', query);
    const staff = await Staff.find(query).sort({ createdAt: -1 });
    console.log('Staff found:', staff.length);
    
    // Return empty array if no staff exist
    if (!staff || staff.length === 0) {
      console.log('No staff found, returning empty array');
      return res.json([]);
    }
    
    console.log('Returning staff:', staff.map(s => s.name));
    res.json(staff);
  } catch (error) {
    console.error('=== STAFF API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // If it's a collection doesn't exist error, return empty array
    if (error.message && error.message.includes('Collection')) {
      console.log('Staff collection does not exist, returning empty array');
      return res.json([]);
    }
    
    console.error('Returning 500 error to client');
    res.status(500).json({ message: error.message, error: error.stack });
  }
});

// Get active staff only
router.get('/active', auth, async (req, res) => {
  try {
    console.log('Fetching active staff only...');
    const activeStaff = await Staff.find({ isActive: true }).sort({ name: 1 });
    console.log('Active staff found:', activeStaff.length);
    res.json(activeStaff);
  } catch (error) {
    console.error('Error fetching active staff:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get staff by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff by ID:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new staff
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new staff:', req.body);
    
    // Check if email already exists
    const existingStaff = await Staff.findOne({ email: req.body.email });
    if (existingStaff) {
      return res.status(400).json({ message: 'Staff member with this email already exists' });
    }
    
    const staff = new Staff(req.body);
    const newStaff = await staff.save();
    console.log('Staff created successfully');
    res.status(201).json(newStaff);
  } catch (error) {
    console.error('Error creating staff:', error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'Staff member with this email already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update staff
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Updating staff:', req.params.id);
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Check if email is being updated and already exists
    if (req.body.email && req.body.email !== staff.email) {
      const existingStaff = await Staff.findOne({ email: req.body.email });
      if (existingStaff) {
        return res.status(400).json({ message: 'Staff member with this email already exists' });
      }
    }
    
    console.log('Staff updated successfully');
    res.json(staff);
  } catch (error) {
    console.error('Error updating staff:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Staff member with this email already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete staff
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting staff:', req.params.id);
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    console.log('Staff deleted successfully');
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
