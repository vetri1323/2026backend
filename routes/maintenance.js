const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Machine = require('../models/Machine');
const auth = require('../middleware/auth');

// Get all maintenance records with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { machineId, startDate, endDate } = req.query;
    let query = {};

    if (machineId) {
      query.machineId = machineId;
    }

    if (startDate || endDate) {
      query.serviceDate = {};
      if (startDate) query.serviceDate.$gte = new Date(startDate);
      if (endDate) query.serviceDate.$lte = new Date(endDate);
    }

    const maintenance = await Maintenance.find(query)
      .populate('machineId', 'name brand modelNumber')
      .sort({ serviceDate: -1 });
    
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single maintenance record
router.get('/:id', auth, async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id).populate('machineId');
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new maintenance record
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received maintenance data:', req.body);
    
    const { 
      machineId, 
      serviceDate, 
      serviceType, 
      technicianName, 
      nextServiceDate, 
      remarks, 
      cost,
      currentCount,
      nextReminderCount,
      nextReminderDate,
      serviceCount
    } = req.body;

    // Validate required fields
    if (!machineId) {
      return res.status(400).json({ message: 'Machine ID is required' });
    }
    if (!serviceDate) {
      return res.status(400).json({ message: 'Service date is required' });
    }
    if (!serviceType) {
      return res.status(400).json({ message: 'Service type is required' });
    }
    if (!technicianName) {
      return res.status(400).json({ message: 'Technician name is required' });
    }

    // Validate machine exists
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    const maintenance = new Maintenance({
      machineId,
      serviceDate: new Date(serviceDate),
      serviceType,
      technicianName,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      remarks,
      cost,
      currentCount: currentCount ? parseInt(currentCount) : undefined,
      nextReminderCount: nextReminderCount ? parseInt(nextReminderCount) : undefined,
      nextReminderDate: nextReminderDate ? new Date(nextReminderDate) : undefined,
      serviceCount: serviceCount ? parseInt(serviceCount) : undefined
    });

    const savedMaintenance = await maintenance.save();
    const populatedMaintenance = await Maintenance.findById(savedMaintenance._id).populate('machineId');
    
    res.status(201).json(populatedMaintenance);
  } catch (error) {
    console.error('Maintenance creation error:', error);
    res.status(400).json({ message: error.message, error: error.toString() });
  }
});

// Update maintenance record
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert string numbers to integers and handle dates
    if (updateData.currentCount) {
      updateData.currentCount = parseInt(updateData.currentCount);
    }
    if (updateData.nextReminderCount) {
      updateData.nextReminderCount = parseInt(updateData.nextReminderCount);
    }
    if (updateData.serviceCount) {
      updateData.serviceCount = parseInt(updateData.serviceCount);
    }
    if (updateData.nextReminderDate) {
      updateData.nextReminderDate = new Date(updateData.nextReminderDate);
    }
    if (updateData.serviceDate) {
      updateData.serviceDate = new Date(updateData.serviceDate);
    }
    if (updateData.nextServiceDate) {
      updateData.nextServiceDate = new Date(updateData.nextServiceDate);
    }

    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('machineId');
    
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    
    res.json(maintenance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete maintenance record
router.delete('/:id', auth, async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming maintenance alerts
router.get('/alerts/upcoming', auth, async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingMaintenance = await Maintenance.find({
      nextServiceDate: { $gte: today, $lte: nextWeek }
    })
    .populate('machineId', 'name brand modelNumber')
    .sort({ nextServiceDate: 1 });

    // Add priority based on days until service
    const alerts = upcomingMaintenance.map(record => {
      const daysUntilService = Math.ceil((record.nextServiceDate - today) / (1000 * 60 * 60 * 24));
      let priority = 'low';
      
      if (daysUntilService <= 1) priority = 'high';
      else if (daysUntilService <= 3) priority = 'medium';

      return {
        ...record.toObject(),
        daysUntilService,
        priority
      };
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
