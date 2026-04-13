const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ ALLOWED FRONTENDS (IMPORTANT)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://127.0.0.1:5173',
  'https://g2026-frontend.onrender.com',
  'https://celebrated-kashata-1a90d0.netlify.app' // Updated frontend URL
];

// ✅ CORS FIX (PRODUCTION READY)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / mobile apps

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed: ' + origin));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection with fallback handling
const connectDB = async () => {
  try {
    // Try primary MongoDB Atlas connection
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.warn('MongoDB Atlas connection failed, trying local MongoDB...', error.message);
    
    try {
      // Fallback to local MongoDB
      await mongoose.connect('mongodb://localhost:27017/machinery_maintenance_local', {
        serverSelectionTimeoutMS: 3000
      });
      console.log('Local MongoDB connected successfully');
    } catch (localError) {
      console.warn('Local MongoDB connection failed, running without database...', localError.message);
      console.log('API will run with mock responses and localStorage fallbacks');
      
      // Continue without database connection
      // Routes will need to handle the disconnected state
    }
  }
};

connectDB();

// Database check middleware removed - database is working properly

// ✅ Routes
app.use('/api/machines', require('./routes/machines'));
app.use('/api/readings', require('./routes/readings'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/services', require('./routes/services'));
app.use('/api/subservices', require('./routes/subservices'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/expense-categories', require('./routes/expense-categories'));
app.use('/api/expense-subcategories', require('./routes/expense-subcategories'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/stock-management', require('./routes/stock-management'));
app.use('/api/general-categories', require('./routes/general-categories'));
app.use('/api/profit-loss', require('./routes/profit-loss'));
app.use('/api/staff', require('./routes/staff'));

// ✅ Test route
app.get('/', (req, res) => {
  res.json({ message: 'API running ✅' });
});

// ✅ Health check (Render uses this)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ✅ Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please:`);
    console.error('1. Close the application using port 5001');
    console.error('2. Or change the PORT in your .env file');
    console.error('3. Or run: netstat -ano | findstr :5001 (Windows) to find the process');
  } else {
    console.error('Server error:', err);
  }
});