const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const auth = require('../middleware/auth');

// Get all machines
router.get('/', auth, async (req, res) => {
  try {
    const machines = await Machine.find().sort({ createdAt: -1 });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single machine
router.get('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.json(machine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new machine
router.post('/', auth, async (req, res) => {
  try {
    const machine = new Machine(req.body);
    const savedMachine = await machine.save();
    res.status(201).json(savedMachine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update machine
router.put('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.json(machine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete machine
router.delete('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
