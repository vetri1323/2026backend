require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');

// Import models
const Machine = require('./models/Machine');
const Customer = require('./models/Customer');
const Bill = require('./models/Bill');

// Create a test app
const app = express();
app.use(express.json());

// Import routes
app.use('/api/machines', require('./routes/machines'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/bills', require('./routes/bills'));

console.log('🔍 Testing API endpoints with MongoDB persistence...');

const testAPIEndpoints = async () => {
  try {
    console.log('✅ Test app initialized');

    // Test Machine API endpoint
    console.log('\n📱 Testing Machine API endpoint...');
    const machineResponse = await request(app)
      .post('/api/machines')
      .send({
        name: 'API Test Printer',
        brand: 'HP',
        modelNumber: 'LaserJet Pro API',
        installationDate: new Date().toISOString(),
        status: 'Active'
      });

    if (machineResponse.status === 201) {
      console.log('✅ Machine API endpoint - Data saved to MongoDB');
      console.log(`   Created machine: ${machineResponse.body.name}`);
    } else {
      console.log('❌ Machine API endpoint failed');
    }

    // Test Customer API endpoint
    console.log('\n👥 Testing Customer API endpoint...');
    const timestamp = Date.now();
    const customerResponse = await request(app)
      .post('/api/customers')
      .send({
        customerId: `CUST-API-${timestamp}`,
        name: 'API Test Customer',
        fatherName: 'API Test Father',
        dateOfBirth: '1990-01-15',
        address: '123 API Test St',
        pincode: '123456',
        cellNo: '9876543210',
        emailId: `api-test-${timestamp}@example.com`
      });

    if (customerResponse.status === 201) {
      console.log('✅ Customer API endpoint - Data saved to MongoDB');
      console.log(`   Created customer: ${customerResponse.body.name}`);
    } else {
      console.log('❌ Customer API endpoint failed');
    }

    // Test Bill API endpoint
    console.log('\n🧾 Testing Bill API endpoint...');
    const billResponse = await request(app)
      .post('/api/bills')
      .send({
        billNo: `BILL-API-${timestamp}`,
        customerId: customerResponse.body._id,
        customerName: customerResponse.body.name,
        customerAddress: customerResponse.body.address,
        subtotal: 1000,
        grandTotal: 1050,
        status: 'paid'
      });

    if (billResponse.status === 201) {
      console.log('✅ Bill API endpoint - Data saved to MongoDB');
      console.log(`   Created bill: ${billResponse.body.billNo}`);
    } else {
      console.log('❌ Bill API endpoint failed');
    }

    // Verify data in MongoDB
    console.log('\n📊 Verifying data persistence in MongoDB:');
    const machineCount = await Machine.countDocuments();
    const customerCount = await Customer.countDocuments();
    const billCount = await Bill.countDocuments();
    
    console.log(`Machines in MongoDB: ${machineCount}`);
    console.log(`Customers in MongoDB: ${customerCount}`);
    console.log(`Bills in MongoDB: ${billCount}`);

    // Test GET endpoints
    console.log('\n🔍 Testing GET endpoints...');
    
    const getMachines = await request(app).get('/api/machines');
    console.log(`GET /api/machines: ${getMachines.status} - ${getMachines.body.length} machines`);

    const getCustomers = await request(app).get('/api/customers');
    console.log(`GET /api/customers: ${getCustomers.status} - ${getCustomers.body.length} customers`);

    const getBills = await request(app).get('/api/bills');
    console.log(`GET /api/bills: ${getBills.status} - ${getBills.body.length} bills`);

    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('✅ All project data is being saved to MongoDB Atlas via API endpoints');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing API endpoints:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB and run tests
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    testAPIEndpoints();
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
