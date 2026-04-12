require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const Machine = require('./models/Machine');
const Customer = require('./models/Customer');
const Bill = require('./models/Bill');
const Expense = require('./models/Expense');
const ExpenseCategory = require('./models/ExpenseCategory');
const ExpenseSubCategory = require('./models/ExpenseSubCategory');
const ProfitLoss = require('./models/ProfitLoss');
const Reading = require('./models/Reading');
const Maintenance = require('./models/Maintenance');
const Service = require('./models/Service');
const SubService = require('./models/SubService');
const StockItem = require('./models/StockItem');
const StockCategory = require('./models/StockCategory');
const Reminder = require('./models/Reminder');

console.log('🔍 Testing all MongoDB models and data persistence...\n');

const testAllModels = async () => {
  try {
    // Test Machine model
    console.log('📱 Testing Machine model...');
    const machine = new Machine({
      name: 'Test Printer',
      brand: 'HP',
      modelNumber: 'LaserJet Pro',
      installationDate: new Date(),
      serviceCenterDetails: 'HP Service Center',
      warrantyStartDate: new Date(),
      warrantyExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
      emailId: `john${timestamp}@example.com`,
      refer: 'Website'
    });
    await customer.save();
    console.log('✅ Customer saved successfully');

    // Test Expense Category model
    console.log('💰 Testing ExpenseCategory model...');
    const expenseCategory = new ExpenseCategory({
      name: 'Operating Expenses',
      description: 'Day to day operating expenses'
    });
    await expenseCategory.save();
    console.log('✅ ExpenseCategory saved successfully');

    // Test Expense SubCategory model
    console.log('📊 Testing ExpenseSubCategory model...');
    const expenseSubCategory = new ExpenseSubCategory({
      name: 'Office Supplies',
      categoryId: expenseCategory._id
    });
    await expenseSubCategory.save();
    console.log('✅ ExpenseSubCategory saved successfully');

    // Test Expense model
    console.log('💸 Testing Expense model...');
    const expense = new Expense({
      expenseNo: `EXP-${timestamp}`,
      categoryId: expenseCategory._id,
      subCategoryId: expenseSubCategory._id,
      amount: 1500,
      date: new Date(),
      description: 'Office supplies purchase',
      paymentMethod: 'cash',
      status: 'approved'
    });
    await expense.save();
    console.log('✅ Expense saved successfully');

    // Test Service model
    console.log('🔧 Testing Service model...');
    const service = new Service({
      serviceName: 'Printer Repair'
    });
    await service.save();
    console.log('✅ Service saved successfully');

    // Test SubService model
    console.log('⚙️ Testing SubService model...');
    const subService = new SubService({
      subServiceName: 'Cartridge Replacement',
      serviceId: service._id,
      price: 500
    });
    await subService.save();
    console.log('✅ SubService saved successfully');

    // Test Bill model
    console.log('🧾 Testing Bill model...');
    const bill = new Bill({
      billNo: `BILL-${timestamp}`,
      customerId: customer._id,
      customerName: customer.name,
      customerAddress: customer.address,
      billDate: new Date(),
      subtotal: 1000,
      serviceCharges: 100,
      discount: 50,
      grandTotal: 1050,
      paymentMethod: 'cash',
      customerType: 'cash',
      status: 'paid'
    });
    await bill.save();
    console.log('✅ Bill saved successfully');

    // Test Reading model
    console.log('📈 Testing Reading model...');
    const reading = new Reading({
      machineId: machine._id,
      date: new Date(),
      currentCount: 1500,
      previousCount: 1000,
      totalPrints: 500,
      remarks: 'Regular reading'
    });
    await reading.save();
    console.log('✅ Reading saved successfully');

    // Test Maintenance model
    console.log('🔨 Testing Maintenance model...');
    const maintenance = new Maintenance({
      machineId: machine._id,
      serviceDate: new Date(),
      serviceType: 'General Service',
      technicianName: 'Tech John',
      nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remarks: 'Regular maintenance',
      cost: 500
    });
    await maintenance.save();
    console.log('✅ Maintenance saved successfully');

    // Test Profit & Loss model
    console.log('📊 Testing ProfitLoss model...');
    const profitLoss = new ProfitLoss({
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      revenue: {
        total: 15000,
        breakdown: [{
          source: 'Sales',
          amount: 15000,
          description: 'Revenue from paid bills'
        }]
      },
      expenses: {
        total: 3500,
        breakdown: [{
          categoryId: expenseCategory._id,
          categoryName: expenseCategory.name,
          amount: 3500,
          subcategories: [{
            subCategoryId: expenseSubCategory._id,
            subcategoryName: expenseSubCategory.name,
            amount: 3500
          }]
        }]
      },
      status: 'draft'
    });
    await profitLoss.save();
    console.log('✅ ProfitLoss saved successfully');

    // Test Reminder model
    console.log('⏰ Testing Reminder model...');
    const reminder = new Reminder({
      title: 'Annual Service Reminder',
      description: 'Annual service reminder for customer',
      type: 'maintenance',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      relatedTo: 'customer',
      relatedId: customer._id,
      status: 'pending'
    });
    await reminder.save();
    console.log('✅ Reminder saved successfully');

    // Test Stock Category model
    console.log('📦 Testing StockCategory model...');
    const stockCategory = new StockCategory({
      name: 'Printer Parts',
      description: 'Spare parts for printers'
    });
    await stockCategory.save();
    console.log('✅ StockCategory saved successfully');

    // Test Stock Item model
    console.log('🏷️ Testing StockItem model...');
    const stockItem = new StockItem({
      itemName: 'HP Toner Cartridge',
      category: 'Ink',
      subCategory: 'Toner',
      currentStock: 10,
      minStock: 5,
      unit: 'units',
      unitPrice: 2500,
      supplier: 'HP Supplier'
    });
    await stockItem.save();
    console.log('✅ StockItem saved successfully');

    // Verify all data was saved by counting documents
    console.log('\n📊 Verifying data persistence:');
    console.log(`Machines: ${await Machine.countDocuments()}`);
    console.log(`Customers: ${await Customer.countDocuments()}`);
    console.log(`Bills: ${await Bill.countDocuments()}`);
    console.log(`Expenses: ${await Expense.countDocuments()}`);
    console.log(`Expense Categories: ${await ExpenseCategory.countDocuments()}`);
    console.log(`Expense SubCategories: ${await ExpenseSubCategory.countDocuments()}`);
    console.log(`Services: ${await Service.countDocuments()}`);
    console.log(`SubServices: ${await SubService.countDocuments()}`);
    console.log(`Readings: ${await Reading.countDocuments()}`);
    console.log(`Maintenance Records: ${await Maintenance.countDocuments()}`);
    console.log(`Profit & Loss Statements: ${await ProfitLoss.countDocuments()}`);
    console.log(`Reminders: ${await Reminder.countDocuments()}`);
    console.log(`Stock Categories: ${await StockCategory.countDocuments()}`);
    console.log(`Stock Items: ${await StockItem.countDocuments()}`);

    console.log('\n🎉 All models tested successfully! Data is being saved to MongoDB Atlas.');
    console.log('✅ Total project data is now properly configured to save in MongoDB');

    // Clean up test data (optional - comment out if you want to keep test data)
    console.log('\n🧹 Cleaning up test data...');
    await Machine.deleteMany({});
    await Customer.deleteMany({});
    await Bill.deleteMany({});
    await Expense.deleteMany({});
    await ExpenseCategory.deleteMany({});
    await ExpenseSubCategory.deleteMany({});
    await Service.deleteMany({});
    await SubService.deleteMany({});
    await Reading.deleteMany({});
    await Maintenance.deleteMany({});
    await ProfitLoss.deleteMany({});
    await Reminder.deleteMany({});
    await StockCategory.deleteMany({});
    await StockItem.deleteMany({});
    console.log('✅ Test data cleaned up');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing models:', error.message);
    process.exit(1);
  }
};

// Run the test
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas\n');
    testAllModels();
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
