require('dotenv').config();
const mongoose = require('mongoose');

// Import core models
const Machine = require('./models/Machine');
const Customer = require('./models/Customer');
const Bill = require('./models/Bill');

console.log('🔍 Testing core MongoDB models...');

const testCoreModels = async () => {
  try {
    // Test Machine model
    console.log('📱 Testing Machine model...');
    const machine = new Machine({
      name: 'Test Printer',
      brand: 'HP',
      modelNumber: 'LaserJet Pro',
      installationDate: new Date(),
      status: 'Active'
    });
    await machine.save();
    console.log('✅ Machine saved successfully');

    // Test Customer model
    console.log('👥 Testing Customer model...');
    const timestamp = Date.now();
    const customer = new Customer({
      customerId: `CUST-${timestamp}`,
      name: 'John Doe',
      fatherName: 'Robert Doe',
      dateOfBirth: new Date('1990-01-15'),
      address: '123 Main St, City',
      pincode: '123456',
      cellNo: '9876543210',
      emailId: `john${timestamp}@example.com`
    });
    await customer.save();
    console.log('✅ Customer saved successfully');

    // Test Bill model
    console.log('🧾 Testing Bill model...');
    const bill = new Bill({
      billNo: `BILL-${timestamp}`,
      customerId: customer._id,
      customerName: customer.name,
      customerAddress: customer.address,
      subtotal: 1000,
      grandTotal: 1050,
      status: 'paid'
    });
    await bill.save();
    console.log('✅ Bill saved successfully');

    // Verify data persistence
    console.log('\n📊 Verifying data persistence:');
    const machineCount = await Machine.countDocuments();
    const customerCount = await Customer.countDocuments();
    const billCount = await Bill.countDocuments();
    
    console.log(`Machines: ${machineCount}`);
    console.log(`Customers: ${customerCount}`);
    console.log(`Bills: ${billCount}`);

    console.log('\n🎉 Core MongoDB models working successfully!');
    console.log('✅ Project data is being saved to MongoDB Atlas');

    // Test data retrieval
    console.log('\n🔍 Testing data retrieval...');
    const retrievedMachines = await Machine.find();
    const retrievedCustomers = await Customer.find();
    const retrievedBills = await Bill.find();
    
    console.log(`Retrieved ${retrievedMachines.length} machines`);
    console.log(`Retrieved ${retrievedCustomers.length} customers`);
    console.log(`Retrieved ${retrievedBills.length} bills`);

    console.log('\n✅ All tests passed! MongoDB is fully operational.');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing models:', error.message);
    process.exit(1);
  }
};

// Run test
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas\n');
    testCoreModels();
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
