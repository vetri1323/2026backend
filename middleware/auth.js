const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if it's the mock token for development
  if (token === 'mock-jwt-token') {
    console.log('Using mock authentication for development');
    // Add a mock user to the request with proper ObjectId format
    req.user = {
      userId: '507f1f77bcf86cd799439011', // Mock ObjectId
      email: 'mock@example.com',
      role: 'admin'
    };
    return next();
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token, authorization denied' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};
