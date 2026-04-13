const mongoose = require('mongoose');
require('dotenv').config();

// Import Service model
const Service = require('./models/Service');

const testServicesAPI = async () => {
  try {
    console.log('=== Testing Services API ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Get all services
    console.log('\n--- Test 1: Get all services ---');
    const allServices = await Service.find();
    console.log(`Found ${allServices.length} services`);
    allServices.forEach(s => console.log(`- ${s.serviceName} (${s._id})`));
    
    // Test 2: Create a new service
    console.log('\n--- Test 2: Create new service ---');
    const newService = new Service({
      serviceName: 'Test Service from API Test',
      description: 'This is a test service created via API test',
      isActive: true
    });
    const savedService = await newService.save();
    console.log(`✅ Created service: ${savedService.serviceName} (${savedService._id})`);
    
    // Test 3: Get all services again to verify
    console.log('\n--- Test 3: Verify service was saved ---');
    const updatedServices = await Service.find();
    console.log(`Now found ${updatedServices.length} services`);
    
    // Clean up - remove test service
    console.log('\n--- Cleanup ---');
    await Service.findByIdAndDelete(savedService._id);
    console.log('✅ Test service deleted');
    
    console.log('\n=== Services API Test Complete ===');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Services API test failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

testServicesAPI();
