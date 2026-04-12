const express = require('express');
const router = express.Router();
const Reading = require('../models/Reading');
const Machine = require('../models/Machine');
const auth = require('../middleware/auth');

// Get all readings with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { machineId, startDate, endDate } = req.query;
    let query = {};

    if (machineId) {
      query.machineId = machineId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const readings = await Reading.find(query)
      .populate('machineId', 'name brand modelNumber')
      .sort({ date: -1 });
    
    res.json(readings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single reading
router.get('/:id', auth, async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id).populate('machineId');
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    res.json(reading);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new reading with auto-calculation
router.post('/', auth, async (req, res) => {
  try {
    const { machineId, date, currentCount, remarks } = req.body;

    // Validate machine exists
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    // Get previous reading for this machine (before the current reading date)
    const previousReading = await Reading.findOne({ 
      machineId,
      date: { $lt: new Date(date) }
    }).sort({ date: -1 });

    const previousCount = previousReading ? previousReading.currentCount : 0;
    const totalPrints = currentCount - previousCount;

    const reading = new Reading({
      machineId,
      date: new Date(date),
      currentCount,
      previousCount,
      totalPrints: Math.max(0, totalPrints),
      remarks
    });

    const savedReading = await reading.save();
    const populatedReading = await Reading.findById(savedReading._id).populate('machineId');
    
    res.status(201).json(populatedReading);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update reading
router.put('/:id', auth, async (req, res) => {
  try {
    const { machineId, date, currentCount } = req.body;
    
    // Get the reading being updated
    const existingReading = await Reading.findById(req.params.id);
    if (!existingReading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    // Get previous reading for this machine (before the current reading date)
    const previousReading = await Reading.findOne({ 
      machineId: existingReading.machineId,
      date: { $lt: new Date(date || existingReading.date) },
      _id: { $ne: req.params.id } // Exclude the current reading
    }).sort({ date: -1 });

    const previousCount = previousReading ? previousReading.currentCount : 0;
    const totalPrints = currentCount - previousCount;

    const updateData = {
      ...req.body,
      previousCount,
      totalPrints: Math.max(0, totalPrints)
    };

    const reading = await Reading.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('machineId');
    
    res.json(reading);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete reading
router.delete('/:id', auth, async (req, res) => {
  try {
    const reading = await Reading.findByIdAndDelete(req.params.id);
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    res.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get today's readings
router.get('/today/all', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const readings = await Reading.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('machineId', 'name brand modelNumber');

    res.json(readings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
