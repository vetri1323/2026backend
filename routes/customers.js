const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'customer-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Minimal test endpoint
router.get('/minimal', (req, res) => {
  console.log('Minimal test endpoint called');
  res.json({ 
    message: 'Minimal test working',
    timestamp: new Date().toISOString()
  });
});

// Get all customers
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all customers...');
    const Customer = require('../models/Customer');
    const customers = await Customer.find().sort({ createdAt: -1 });
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = new Customer(req.body);
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Customer ID already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    Object.assign(customer, req.body);
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Customer ID already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload customer photo
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    customer.photo = req.file.filename;
    await customer.save();
    
    res.json({ 
      message: 'Photo uploaded successfully', 
      photo: customer.photo 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update customer photo
router.put('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    customer.photo = req.file.filename;
    await customer.save();
    
    res.json({ 
      message: 'Photo updated successfully', 
      photo: customer.photo 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete customer photo
router.delete('/:id/photo', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.photo = undefined;
    await customer.save();
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add reminder to customer
router.post('/:id/reminders', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const mongoose = require('mongoose');
    const reminderData = {
      ...req.body,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!customer.reminders) {
      customer.reminders = [];
    }
    console.log('Adding reminder to customer:', reminderData);
    customer.reminders.push(reminderData);
    await customer.save();
    console.log('Customer after save:', customer);
    console.log('Customer reminders after save:', customer.reminders);
    
    res.status(201).json(reminderData);
  } catch (error) {
    console.error('Error adding reminder:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update customer reminder
router.put('/:id/reminders/:reminderId', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const reminder = customer.reminders.id(req.params.reminderId);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    Object.assign(reminder, req.body, { updatedAt: new Date() });
    await customer.save();
    
    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete customer reminder
router.delete('/:id/reminders/:reminderId', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.reminders.pull(req.params.reminderId);
    await customer.save();
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update reminder status
router.patch('/:id/reminders/:reminderId/status', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const reminder = customer.reminders.id(req.params.reminderId);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    reminder.serviceStatus = req.body.status;
    reminder.updatedAt = new Date();
    await customer.save();
    
    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
