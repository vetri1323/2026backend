const express = require('express');
const router = express.Router();
const ExpenseCategory = require('../models/ExpenseCategory');
const auth = require('../middleware/auth');

// Get all expense categories
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== EXPENSE CATEGORIES API DEBUG ===');
    console.log('Fetching all expense categories...');
    console.log('User authenticated:', req.user);
    
    // Check if the expense categories collection exists and has data
    console.log('Querying expense categories collection...');
    const categories = await ExpenseCategory.find().sort({ createdAt: -1 });
    console.log('Expense categories found:', categories.length);
    
    // If no categories exist, create default categories
    if (!categories || categories.length === 0) {
      console.log('No expense categories found, creating default categories...');
      
      const defaultCategories = [
        {
          name: 'Office Supplies',
          description: 'Stationery, office equipment, and other office necessities',
          isActive: true
        },
        {
          name: 'Maintenance',
          description: 'Equipment maintenance, repairs, and spare parts',
          isActive: true
        },
        {
          name: 'Utilities',
          description: 'Electricity, water, internet, and other utility bills',
          isActive: true
        },
        {
          name: 'Travel',
          description: 'Business travel, accommodation, and transportation',
          isActive: true
        },
        {
          name: 'Marketing',
          description: 'Advertising, promotions, and marketing materials',
          isActive: true
        },
        {
          name: 'Other Expenses',
          description: 'Miscellaneous expenses and other costs',
          isActive: true
        }
      ];
      
      console.log('Inserting default expense categories...');
      const createdCategories = await ExpenseCategory.insertMany(defaultCategories);
      console.log('Default expense categories created:', createdCategories.length);
      console.log('Created categories:', createdCategories.map(c => c.name));
      return res.json(createdCategories);
    }
    
    console.log('Returning existing expense categories:', categories.map(c => c.name));
    res.json(categories);
  } catch (error) {
    console.error('=== EXPENSE CATEGORIES API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // If it's a collection doesn't exist error, create default categories
    if (error.message && error.message.includes('Collection')) {
      console.log('Expense categories collection does not exist, creating default categories...');
      
      const defaultCategories = [
        {
          name: 'Office Supplies',
          description: 'Stationery, office equipment, and other office necessities',
          isActive: true
        },
        {
          name: 'Maintenance',
          description: 'Equipment maintenance, repairs, and spare parts',
          isActive: true
        },
        {
          name: 'Utilities',
          description: 'Electricity, water, internet, and other utility bills',
          isActive: true
        },
        {
          name: 'Travel',
          description: 'Business travel, accommodation, and transportation',
          isActive: true
        },
        {
          name: 'Marketing',
          description: 'Advertising, promotions, and marketing materials',
          isActive: true
        },
        {
          name: 'Other Expenses',
          description: 'Miscellaneous expenses and other costs',
          isActive: true
        }
      ];
      
      try {
        console.log('Attempting to create default expense categories after collection error...');
        const createdCategories = await ExpenseCategory.insertMany(defaultCategories);
        console.log('Default expense categories created:', createdCategories.length);
        return res.json(createdCategories);
      } catch (createError) {
        console.error('Error creating default expense categories:', createError);
        console.error('Create error details:', createError.message);
        return res.status(500).json({ message: 'Failed to create default expense categories', error: createError.message });
      }
    }
    
    console.error('Returning 500 error to client');
    res.status(500).json({ message: error.message, error: error.stack });
  }
});

// Get expense category by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Expense category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching expense category by ID:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new expense category
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new expense category:', req.body);
    const category = new ExpenseCategory(req.body);
    const newCategory = await category.save();
    console.log('Expense category created successfully');
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update expense category
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Updating expense category:', req.params.id);
    const category = await ExpenseCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Expense category not found' });
    }
    console.log('Expense category updated successfully');
    res.json(category);
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete expense category
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting expense category:', req.params.id);
    const category = await ExpenseCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Expense category not found' });
    }
    console.log('Expense category deleted successfully');
    res.json({ message: 'Expense category deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
