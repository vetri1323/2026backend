const express = require('express');
const router = express.Router();
const StockItem = require('../models/StockItem');
const StockCategory = require('../models/StockCategory');
const auth = require('../middleware/auth');

// Get all stock items
router.get('/items', auth, async (req, res) => {
  try {
    const { category, subCategory, search } = req.query;
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    const items = await StockItem.find(query).sort({ category: 1, subCategory: 1, itemName: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await StockItem.getCategoryStats();
    const lowStockItems = await StockItem.getLowStockItems();
    const criticalItems = await StockItem.getCriticalItems();
    
    res.json({
      categoryStats: stats,
      lowStockCount: lowStockItems.length,
      criticalCount: criticalItems.length,
      totalItems: await StockItem.countDocuments({ isActive: true }),
      totalStock: await StockItem.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$currentStock' } } }
      ])
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update stock item
router.post('/items', auth, async (req, res) => {
  try {
    const itemData = req.body;
    
    if (itemData._id) {
      // Update existing item
      const item = await StockItem.findByIdAndUpdate(
        itemData._id,
        { ...itemData, lastRestocked: new Date() },
        { new: true, runValidators: true }
      );
      res.json(item);
    } else {
      // Create new item
      const item = new StockItem(itemData);
      await item.save();
      res.status(201).json(item);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update stock item (PUT method for frontend compatibility)
router.put('/items/:id', auth, async (req, res) => {
  try {
    const item = await StockItem.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastRestocked: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete stock item
router.delete('/items/:id', auth, async (req, res) => {
  try {
    await StockItem.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock categories
router.get('/categories', auth, async (req, res) => {
  try {
    let categories = await StockCategory.find({ isActive: true });
    
    // If no categories exist, create default ones
    if (categories.length === 0) {
      const defaultCategories = StockCategory.getDefaultCategories();
      categories = await StockCategory.insertMany(defaultCategories);
    }
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update stock category
router.post('/categories', auth, async (req, res) => {
  try {
    const categoryData = req.body;
    
    if (categoryData._id) {
      const category = await StockCategory.findByIdAndUpdate(
        categoryData._id,
        categoryData,
        { new: true, runValidators: true }
      );
      res.json(category);
    } else {
      const category = new StockCategory(categoryData);
      await category.save();
      res.status(201).json(category);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete stock category
router.delete('/categories/:id', auth, async (req, res) => {
  try {
    await StockCategory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock subcategories
router.get('/subcategories', auth, async (req, res) => {
  try {
    const { categoryId } = req.query;
    let query = { isActive: true };
    
    if (categoryId) {
      const category = await StockCategory.findById(categoryId);
      if (category) {
        return res.json(category.subcategories.filter(sub => sub.isActive !== false));
      }
    }
    
    // Get all subcategories from all active categories
    const categories = await StockCategory.find({ isActive: true });
    const allSubcategories = [];
    
    categories.forEach(category => {
      category.subcategories.forEach(sub => {
        if (sub.isActive !== false) {
          allSubcategories.push({
            ...sub.toObject(),
            categoryId: category._id,
            categoryName: category.name
          });
        }
      });
    });
    
    res.json(allSubcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update stock subcategory
router.post('/subcategories', auth, async (req, res) => {
  try {
    const { categoryId, subcategoryData } = req.body;
    
    const category = await StockCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (subcategoryData._id) {
      // Update existing subcategory
      const subIndex = category.subcategories.findIndex(sub => sub._id.toString() === subcategoryData._id);
      if (subIndex !== -1) {
        category.subcategories[subIndex] = subcategoryData;
        await category.save();
        return res.json(category.subcategories[subIndex]);
      }
    } else {
      // Add new subcategory
      category.subcategories.push(subcategoryData);
      await category.save();
      return res.status(201).json(category.subcategories[category.subcategories.length - 1]);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete stock subcategory
router.delete('/subcategories/:categoryId/:subcategoryId', auth, async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    
    const category = await StockCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    category.subcategories = category.subcategories.filter(sub => sub._id.toString() !== subcategoryId);
    await category.save();
    
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
