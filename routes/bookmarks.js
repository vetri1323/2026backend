const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const mongoose = require('mongoose');

// Get all bookmarks with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, favorite } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (favorite === 'true') {
      query.isFavorite = true;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const bookmarks = await Bookmark.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Bookmark.countDocuments(query);
    
    res.json({
      bookmarks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks', error: error.message });
  }
});

// Get single bookmark by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bookmark ID' });
    }
    
    const bookmark = await Bookmark.findById(req.params.id);
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    res.json(bookmark);
  } catch (error) {
    console.error('Error fetching bookmark:', error);
    res.status(500).json({ message: 'Error fetching bookmark', error: error.message });
  }
});

// Create new bookmark
router.post('/', async (req, res) => {
  try {
    const { serviceName, url, description, category, tags, favicon, color } = req.body;
    
    if (!serviceName || !url) {
      return res.status(400).json({ message: 'Service name and URL are required' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    // Get the highest order value and increment
    const lastBookmark = await Bookmark.findOne().sort({ order: -1 });
    const order = lastBookmark ? lastBookmark.order + 1 : 0;
    
    const bookmark = new Bookmark({
      serviceName,
      url,
      description,
      category,
      tags: tags || [],
      favicon,
      color: color || '#3b82f6',
      order
    });
    
    const savedBookmark = await bookmark.save();
    res.status(201).json(savedBookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bookmark with this service name already exists' });
    }
    res.status(500).json({ message: 'Error creating bookmark', error: error.message });
  }
});

// Update bookmark
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bookmark ID' });
    }
    
    const { serviceName, url, description, category, tags, favicon, color, isFavorite } = req.body;
    
    if (!serviceName || !url) {
      return res.status(400).json({ message: 'Service name and URL are required' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    const bookmark = await Bookmark.findByIdAndUpdate(
      req.params.id,
      {
        serviceName,
        url,
        description,
        category,
        tags: tags || [],
        favicon,
        color,
        isFavorite,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    res.json(bookmark);
  } catch (error) {
    console.error('Error updating bookmark:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bookmark with this service name already exists' });
    }
    res.status(500).json({ message: 'Error updating bookmark', error: error.message });
  }
});

// Delete bookmark
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bookmark ID' });
    }
    
    const bookmark = await Bookmark.findByIdAndDelete(req.params.id);
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    res.json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ message: 'Error deleting bookmark', error: error.message });
  }
});

// Toggle favorite status
router.patch('/:id/favorite', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bookmark ID' });
    }
    
    const bookmark = await Bookmark.findById(req.params.id);
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    bookmark.isFavorite = !bookmark.isFavorite;
    await bookmark.save();
    
    res.json(bookmark);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Error toggling favorite', error: error.message });
  }
});

// Reorder bookmarks
router.put('/reorder', async (req, res) => {
  try {
    const { bookmarks } = req.body;
    
    if (!Array.isArray(bookmarks)) {
      return res.status(400).json({ message: 'Bookmarks must be an array' });
    }
    
    const bulkOps = bookmarks.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order, updatedAt: Date.now() } }
      }
    }));
    
    await Bookmark.bulkWrite(bulkOps);
    
    res.json({ message: 'Bookmarks reordered successfully' });
  } catch (error) {
    console.error('Error reordering bookmarks:', error);
    res.status(500).json({ message: 'Error reordering bookmarks', error: error.message });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Bookmark.distinct('category');
    const filteredCategories = categories.filter(cat => cat && cat.trim() !== '');
    res.json(filteredCategories.sort());
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

module.exports = router;
