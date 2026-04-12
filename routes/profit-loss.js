const express = require('express');
const router = express.Router();
const ProfitLoss = require('../models/ProfitLoss');
const Bill = require('../models/Bill');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const ExpenseSubCategory = require('../models/ExpenseSubCategory');
const auth = require('../middleware/auth');

// Get all profit & loss statements
router.get('/', auth, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    let filter = {};
    
    if (period) {
      filter.period = period;
    }
    
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }
    
    const profitLossStatements = await ProfitLoss.find(filter)
      .sort({ startDate: -1 });
    
    res.json(profitLossStatements);
  } catch (error) {
    console.error('Error fetching profit & loss statements:', error);
    res.status(500).json({ message: 'Error fetching profit & loss statements', error: error.message });
  }
});

// Get profit & loss statement by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const profitLoss = await ProfitLoss.findById(req.params.id)
      .populate('expenses.breakdown.categoryId', 'name')
      .populate('expenses.breakdown.subcategories.subCategoryId', 'name');
    
    if (!profitLoss) {
      return res.status(404).json({ message: 'Profit & Loss statement not found' });
    }
    
    res.json(profitLoss);
  } catch (error) {
    console.error('Error fetching profit & loss statement:', error);
    res.status(500).json({ message: 'Error fetching profit & loss statement', error: error.message });
  }
});

// Generate new profit & loss statement
router.post('/generate', auth, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.body;
    
    if (!period || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Missing required fields: period, startDate, endDate' 
      });
    }
    
    // Check if P&L statement already exists for this period
    const existing = await ProfitLoss.findOne({
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });
    
    if (existing) {
      return res.status(400).json({ 
        message: 'Profit & Loss statement already exists for this period' 
      });
    }
    
    // Calculate revenue from bills
    const revenueBills = await Bill.find({
      billDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'paid'
    });
    
    const totalRevenue = revenueBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    
    // Calculate expenses
    const expenses = await Expense.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'approved'
    }).populate('categoryId', 'name')
     .populate('subCategoryId', 'name');
    
    // Group expenses by category
    const expenseBreakdown = {};
    let totalExpenses = 0;
    
    expenses.forEach(expense => {
      const categoryId = expense.categoryId._id;
      const categoryName = expense.categoryId.name;
      
      if (!expenseBreakdown[categoryId]) {
        expenseBreakdown[categoryId] = {
          categoryId: categoryId,
          categoryName: categoryName,
          amount: 0,
          subcategories: []
        };
      }
      
      expenseBreakdown[categoryId].amount += expense.amount;
      totalExpenses += expense.amount;
      
      // Add subcategory breakdown
      const existingSubcategory = expenseBreakdown[categoryId].subcategories.find(
        sub => sub.subCategoryId.toString() === expense.subCategoryId._id.toString()
      );
      
      if (existingSubcategory) {
        existingSubcategory.amount += expense.amount;
      } else {
        expenseBreakdown[categoryId].subcategories.push({
          subCategoryId: expense.subCategoryId._id,
          subcategoryName: expense.subCategoryId.name,
          amount: expense.amount
        });
      }
    });
    
    // Create revenue breakdown (for now, just total revenue)
    const revenueBreakdown = [{
      source: 'Sales',
      amount: totalRevenue,
      description: 'Revenue from paid bills'
    }];
    
    // Create profit & loss statement
    const profitLoss = new ProfitLoss({
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      revenue: {
        total: totalRevenue,
        breakdown: revenueBreakdown
      },
      expenses: {
        total: totalExpenses,
        breakdown: Object.values(expenseBreakdown)
      }
    });
    
    await profitLoss.save();
    
    // Populate the saved statement
    const populatedProfitLoss = await ProfitLoss.findById(profitLoss._id)
      .populate('expenses.breakdown.categoryId', 'name')
      .populate('expenses.breakdown.subcategories.subCategoryId', 'name');
    
    res.status(201).json(populatedProfitLoss);
  } catch (error) {
    console.error('Error generating profit & loss statement:', error);
    res.status(500).json({ message: 'Error generating profit & loss statement', error: error.message });
  }
});

// Update profit & loss statement
router.put('/:id', auth, async (req, res) => {
  try {
    const { notes, status } = req.body;
    
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    
    const profitLoss = await ProfitLoss.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('expenses.breakdown.categoryId', 'name')
     .populate('expenses.breakdown.subcategories.subCategoryId', 'name');
    
    if (!profitLoss) {
      return res.status(404).json({ message: 'Profit & Loss statement not found' });
    }
    
    res.json(profitLoss);
  } catch (error) {
    console.error('Error updating profit & loss statement:', error);
    res.status(500).json({ message: 'Error updating profit & loss statement', error: error.message });
  }
});

// Delete profit & loss statement
router.delete('/:id', auth, async (req, res) => {
  try {
    const profitLoss = await ProfitLoss.findByIdAndDelete(req.params.id);
    
    if (!profitLoss) {
      return res.status(404).json({ message: 'Profit & Loss statement not found' });
    }
    
    res.json({ message: 'Profit & Loss statement deleted successfully' });
  } catch (error) {
    console.error('Error deleting profit & loss statement:', error);
    res.status(500).json({ message: 'Error deleting profit & loss statement', error: error.message });
  }
});

// Get profit & loss summary for dashboard
router.get('/summary/latest', auth, async (req, res) => {
  try {
    const latestPandL = await ProfitLoss.findOne()
      .sort({ startDate: -1 })
      .populate('expenses.breakdown.categoryId', 'name');
    
    if (!latestPandL) {
      return res.json({ message: 'No profit & loss statements found' });
    }
    
    res.json(latestPandL);
  } catch (error) {
    console.error('Error fetching profit & loss summary:', error);
    res.status(500).json({ message: 'Error fetching profit & loss summary', error: error.message });
  }
});

module.exports = router;
