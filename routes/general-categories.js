const express = require('express');
const router = express.Router();
const GeneralCategory = require('../models/GeneralCategory');
const auth = require('../middleware/auth');

// Get categories by type
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = { isActive: true };
    
    if (type) {
      query.type = type;
    }
    
    const categories = await GeneralCategory.find(query).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get general categories (for the main Categories tab)
router.get('/general', auth, async (req, res) => {
  try {
    const categories = await GeneralCategory.getGeneralCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expense categories
router.get('/expense', auth, async (req, res) => {
  try {
    const categories = await GeneralCategory.getExpenseCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service categories
router.get('/service', auth, async (req, res) => {
  try {
    const categories = await GeneralCategory.getServiceCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update category
router.post('/', auth, async (req, res) => {
  try {
    const categoryData = req.body;
    
    if (categoryData._id) {
      const category = await GeneralCategory.findByIdAndUpdate(
        categoryData._id,
        categoryData,
        { new: true, runValidators: true }
      );
      res.json(category);
    } else {
      const category = new GeneralCategory(categoryData);
      await category.save();
      res.status(201).json(category);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    await GeneralCategory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subcategories
router.get('/subcategories', auth, async (req, res) => {
  try {
    const { categoryId, type } = req.query;
    let query = { isActive: true };
    
    if (categoryId) {
      const category = await GeneralCategory.findById(categoryId);
      if (category) {
        return res.json(category.subcategories.filter(sub => sub.isActive !== false));
      }
    }
    
    if (type) {
      query.type = type;
    }
    
    // Get all subcategories from all active categories of specified type
    const categories = await GeneralCategory.find(query);
    const allSubcategories = [];
    
    categories.forEach(category => {
      category.subcategories.forEach(sub => {
        if (sub.isActive !== false) {
          allSubcategories.push({
            ...sub.toObject(),
            categoryId: category._id,
            categoryName: category.name,
            categoryType: category.type
          });
        }
      });
    });
    
    res.json(allSubcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update subcategory
router.post('/subcategories', auth, async (req, res) => {
  try {
    const { categoryId, subcategoryData } = req.body;
    
    const category = await GeneralCategory.findById(categoryId);
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

// Delete subcategory
router.delete('/subcategories/:categoryId/:subcategoryId', auth, async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    
    const category = await GeneralCategory.findById(categoryId);
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
