const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const auth = require('../middleware/auth');

// Get all reminders
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== REMINDERS API DEBUG ===');
    console.log('Fetching all reminders...');
    console.log('User authenticated:', req.user);
    
    const { status, type, priority, startDate, endDate } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate);
      if (endDate) filter.dueDate.$lte = new Date(endDate);
    }
    
    console.log('Filter:', filter);
    
    const reminders = await Reminder.find(filter)
      .sort({ dueDate: 1, createdAt: -1 });
    
    console.log('Reminders found:', reminders.length);
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Error fetching reminders', error: error.message });
  }
});

// Get upcoming reminders (for dashboard)
router.get('/upcoming', auth, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const reminders = await Reminder.find({
      dueDate: { $gte: today, $lte: thirtyDaysFromNow },
      status: 'pending'
    })
    .sort({ dueDate: 1 })
    .limit(10);
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    res.status(500).json({ message: 'Error fetching upcoming reminders', error: error.message });
  }
});

// Get reminder by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ message: 'Error fetching reminder', error: error.message });
  }
});

// Create new reminder
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== CREATE REMINDER DEBUG ===');
    console.log('Request body:', req.body);
    
    const {
      title,
      description,
      type,
      priority,
      dueDate,
      assignedTo,
      relatedTo,
      relatedId,
      isRecurring,
      recurringPattern
    } = req.body;
    
    // Validate required fields
    if (!title || !dueDate) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, dueDate' 
      });
    }
    
    const reminder = new Reminder({
      title,
      description,
      type: type || 'general',
      priority: priority || 'medium',
      dueDate: new Date(dueDate),
      assignedTo,
      relatedTo: relatedTo || 'general',
      relatedId,
      isRecurring: isRecurring || false,
      recurringPattern,
      createdBy: req.user?.id
    });
    
    console.log('Saving reminder:', reminder);
    const savedReminder = await reminder.save();
    
    console.log('Reminder saved successfully:', savedReminder);
    res.status(201).json(savedReminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Error creating reminder', error: error.message });
  }
});

// Update reminder
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      priority,
      dueDate,
      status,
      assignedTo,
      relatedTo,
      relatedId,
      isRecurring,
      recurringPattern
    } = req.body;
    
    const updateData = {
      title,
      description,
      type,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status,
      assignedTo,
      relatedTo,
      relatedId,
      isRecurring,
      recurringPattern,
      updatedAt: new Date()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Error updating reminder', error: error.message });
  }
});

// Mark reminder as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ message: 'Error completing reminder', error: error.message });
  }
});

// Delete reminder
router.delete('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Error deleting reminder', error: error.message });
  }
});

module.exports = router;
