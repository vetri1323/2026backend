const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  console.log('Simple test endpoint called');
  res.json({ 
    message: 'Simple test working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
