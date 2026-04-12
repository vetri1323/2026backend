const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const auth = require('../middleware/auth');

// Get all services
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== SERVICES API DEBUG ===');
    console.log('Fetching all services...');
    console.log('User authenticated:', req.user);
    
    // Check if the services collection exists and has data
    console.log('Querying services collection...');
    const services = await Service.find().sort({ createdAt: -1 });
    console.log('Services found:', services.length);
    
    // Return empty array if no services exist - no default data
    if (!services || services.length === 0) {
      console.log('No services found, returning empty array');
      return res.json([]);
    }
    
    console.log('Returning existing services:', services.map(s => s.serviceName));
    res.json(services);
  } catch (error) {
    console.error('=== SERVICES API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // If it's a collection doesn't exist error, return empty array
    if (error.message && error.message.includes('Collection')) {
      console.log('Services collection does not exist, returning empty array');
      return res.json([]);
    }
    
    console.error('Returning 500 error to client');
    res.status(500).json({ message: error.message, error: error.stack });
  }
});

// Get service by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new service
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new service:', req.body);
    const service = new Service(req.body);
    const newService = await service.save();
    console.log('Service created successfully');
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update service
router.put('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete service
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
