const express = require('express');
const router = express.Router();
const SubService = require('../models/SubService');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

// Get all sub-services
router.get('/', auth, async (req, res) => {
  try {
    const { serviceId } = req.query;
    let query = {};
    if (serviceId) {
      query.serviceId = serviceId;
    }
    
    const subServices = await SubService.find(query)
      .populate('serviceId', 'serviceName')
      .sort({ createdAt: -1 });
    res.json(subServices);
  } catch (error) {
    console.error('Error fetching sub-services:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sub-service by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const subService = await SubService.findById(req.params.id)
      .populate('serviceId', 'serviceName');
    if (!subService) {
      return res.status(404).json({ message: 'Sub-service not found' });
    }
    res.json(subService);
  } catch (error) {
    console.error('Error fetching sub-service by ID:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new sub-service
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new sub-service:', req.body);
    // Verify service exists
    const service = await Service.findById(req.body.serviceId);
    if (!service) {
      return res.status(400).json({ message: 'Service not found' });
    }

    const subService = new SubService(req.body);
    const newSubService = await subService.save();
    const populatedSubService = await SubService.findById(newSubService._id)
      .populate('serviceId', 'serviceName');
    
    console.log('Sub-service created successfully');
    res.status(201).json(populatedSubService);
  } catch (error) {
    console.error('Error creating sub-service:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update sub-service
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Updating sub-service:', req.params.id);
    const subService = await SubService.findById(req.params.id);
    if (!subService) {
      return res.status(404).json({ message: 'Sub-service not found' });
    }

    // If serviceId is being updated, verify the new service exists
    if (req.body.serviceId && req.body.serviceId !== subService.serviceId.toString()) {
      const service = await Service.findById(req.body.serviceId);
      if (!service) {
        return res.status(400).json({ message: 'Service not found' });
      }
    }

    Object.assign(subService, req.body);
    const updatedSubService = await subService.save();
    const populatedSubService = await SubService.findById(updatedSubService._id)
      .populate('serviceId', 'serviceName');
    
    console.log('Sub-service updated successfully');
    res.json(populatedSubService);
  } catch (error) {
    console.error('Error updating sub-service:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete sub-service
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting sub-service:', req.params.id);
    const subService = await SubService.findById(req.params.id);
    if (!subService) {
      return res.status(404).json({ message: 'Sub-service not found' });
    }

    await SubService.findByIdAndDelete(req.params.id);
    console.log('Sub-service deleted successfully');
    res.json({ message: 'Sub-service deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub-service:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
