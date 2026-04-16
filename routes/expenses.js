const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const auth = require('../middleware/auth');

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== EXPENSES API DEBUG ===');
    console.log('Fetching all expenses...');
    console.log('User authenticated:', req.user);
    
    const { startDate, endDate, categoryId, paymentMethod } = req.query;
    let filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    
    console.log('Filter:', filter);
    
    const expenses = await Expense.find(filter)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .sort({ date: -1 });
    
    console.log('Expenses found:', expenses.length);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
});

// Get expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ message: 'Error fetching expense', error: error.message });
  }
});

// Create new expense
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== CREATE EXPENSE DEBUG ===');
    console.log('Request body:', req.body);
    
    const {
      categoryId,
      subCategoryId,
      amount,
      date,
      description,
      paymentMethod,
      transactionNo,
      receiptNo,
      notes
    } = req.body;
    
    // Validate required fields
    if (!categoryId || !amount) {
      return res.status(400).json({ 
        message: 'Missing required fields: categoryId, amount' 
      });
    }
    
    // Generate expense number
    const expenseCount = await Expense.countDocuments();
    const expenseNo = `EXP-${String(expenseCount + 1).padStart(4, '0')}`;
    
    const expense = new Expense({
      expenseNo,
      categoryId,
      subCategoryId: subCategoryId || null,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      description,
      paymentMethod: paymentMethod || 'cash',
      transactionNo,
      receiptNo,
      notes
    });
    
    console.log('Saving expense:', expense);
    const savedExpense = await expense.save();
    
    // Populate the saved expense
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name');
    
    console.log('Expense saved successfully:', populatedExpense);
    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      amount,
      date,
      description,
      paymentMethod,
      transactionNo,
      receiptNo,
      notes,
      status
    } = req.body;
    
    const updateData = {
      categoryId,
      subCategoryId,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      description,
      paymentMethod,
      transactionNo,
      receiptNo,
      notes,
      updatedAt: new Date()
    };
    
    if (status) {
      updateData.status = status;
    }
    
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name')
     .populate('subCategoryId', 'name');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
});

module.exports = router;
