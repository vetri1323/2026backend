const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      await Service.deleteMany({});
      console.log('All services cleared from database');
      console.log('Consultation Service, Machine Maintenance, Installation Service, Technical Support removed');
    } catch (error) {
      console.error('Error clearing services:', error);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
