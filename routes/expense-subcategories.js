const express = require('express');
const router = express.Router();
const ExpenseSubCategory = require('../models/ExpenseSubCategory');
const ExpenseCategory = require('../models/ExpenseCategory');
const auth = require('../middleware/auth');

// Get all expense subcategories
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== EXPENSE SUBCATEGORIES API DEBUG ===');
    console.log('Fetching all expense subcategories...');
    console.log('User authenticated:', req.user);
    
    const { categoryId, isActive } = req.query;
    let filter = {};
    
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    console.log('Filter:', filter);
    
    const subCategories = await ExpenseSubCategory.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    
    console.log('Expense subcategories found:', subCategories.length);
    res.json(subCategories);
  } catch (error) {
    console.error('Error fetching expense subcategories:', error);
    res.status(500).json({ message: 'Error fetching expense subcategories', error: error.message });
  }
});

// Get expense subcategory by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const subCategory = await ExpenseSubCategory.findById(req.params.id)
      .populate('categoryId', 'name');
    
    if (!subCategory) {
      return res.status(404).json({ message: 'Expense subcategory not found' });
    }
    
    res.json(subCategory);
  } catch (error) {
    console.error('Error fetching expense subcategory:', error);
    res.status(500).json({ message: 'Error fetching expense subcategory', error: error.message });
  }
});

// Create new expense subcategory
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== CREATE EXPENSE SUBCATEGORY DEBUG ===');
    console.log('Request body:', req.body);
    
    const { name, description, categoryId } = req.body;
    
    // Validate required fields
    if (!name || !categoryId) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, categoryId' 
      });
    }
    
    // Check if category exists
    const category = await ExpenseCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    // Check if subcategory with same name exists in this category
    const existingSubCategory = await ExpenseSubCategory.findOne({
      name: name.trim(),
      categoryId
    });
    
    if (existingSubCategory) {
      return res.status(400).json({ 
        message: 'Subcategory with this name already exists in this category' 
      });
    }
    
    const subCategory = new ExpenseSubCategory({
      name: name.trim(),
      description,
      categoryId
    });
    
    console.log('Saving expense subcategory:', subCategory);
    const savedSubCategory = await subCategory.save();
    
    // Populate the saved subcategory
    const populatedSubCategory = await ExpenseSubCategory.findById(savedSubCategory._id)
      .populate('categoryId', 'name');
    
    console.log('Expense subcategory saved successfully:', populatedSubCategory);
    res.status(201).json(populatedSubCategory);
  } catch (error) {
    console.error('Error creating expense subcategory:', error);
    res.status(500).json({ message: 'Error creating expense subcategory', error: error.message });
  }
});

// Update expense subcategory
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, categoryId, isActive } = req.body;
    
    // Validate required fields
    if (!name || !categoryId) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, categoryId' 
      });
    }
    
    // Check if category exists
    const category = await ExpenseCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    // Check if another subcategory with same name exists in this category
    const existingSubCategory = await ExpenseSubCategory.findOne({
      name: name.trim(),
      categoryId,
      _id: { $ne: req.params.id }
    });
    
    if (existingSubCategory) {
      return res.status(400).json({ 
        message: 'Subcategory with this name already exists in this category' 
      });
    }
    
    const updateData = {
      name: name.trim(),
      description,
      categoryId,
      isActive,
      updatedAt: new Date()
    };
    
    const subCategory = await ExpenseSubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');
    
    if (!subCategory) {
      return res.status(404).json({ message: 'Expense subcategory not found' });
    }
    
    res.json(subCategory);
  } catch (error) {
    console.error('Error updating expense subcategory:', error);
    res.status(500).json({ message: 'Error updating expense subcategory', error: error.message });
  }
});

// Toggle expense subcategory status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const subCategory = await ExpenseSubCategory.findById(req.params.id);
    
    if (!subCategory) {
      return res.status(404).json({ message: 'Expense subcategory not found' });
    }
    
    subCategory.isActive = !subCategory.isActive;
    subCategory.updatedAt = new Date();
    
    const updatedSubCategory = await subCategory.save();
    
    const populatedSubCategory = await ExpenseSubCategory.findById(updatedSubCategory._id)
      .populate('categoryId', 'name');
    
    res.json(populatedSubCategory);
  } catch (error) {
    console.error('Error toggling expense subcategory status:', error);
    res.status(500).json({ message: 'Error toggling expense subcategory status', error: error.message });
  }
});

// Delete expense subcategory
router.delete('/:id', auth, async (req, res) => {
  try {
    const subCategory = await ExpenseSubCategory.findByIdAndDelete(req.params.id);
    
    if (!subCategory) {
      return res.status(404).json({ message: 'Expense subcategory not found' });
    }
    
    res.json({ message: 'Expense subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense subcategory:', error);
    res.status(500).json({ message: 'Error deleting expense subcategory', error: error.message });
  }
});

module.exports = router;
