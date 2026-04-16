const mongoose = require('mongoose');
const ExpenseCategory = require('./models/ExpenseCategory');
const ExpenseSubCategory = require('./models/ExpenseSubCategory');
const Expense = require('./models/Expense');

// MongoDB connection
mongoose.connect('mongodb+srv://gdatas:5zyah3fsRly2mxj1@gdatas.avbx9ok.mongodb.net/machinery_maintenance')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedExpenses() {
  try {
    // Clear existing data
    await ExpenseCategory.deleteMany({});
    await ExpenseSubCategory.deleteMany({});
    await Expense.deleteMany({});

    // Create expense categories
    const categories = await ExpenseCategory.insertMany([
      { name: 'Office Supplies', description: 'Stationery and office items', isActive: true },
      { name: 'Utilities', description: 'Electricity, water, internet', isActive: true },
      { name: 'Rent & Maintenance', description: 'Office rent and maintenance', isActive: true },
      { name: 'Marketing', description: 'Advertising and promotions', isActive: true },
      { name: 'Travel', description: 'Business travel expenses', isActive: true }
    ]);

    console.log('Created expense categories:', categories);

    // Create expense subcategories
    const subcategories = await ExpenseSubCategory.insertMany([
      { name: 'Stationery', categoryId: categories[0]._id, isActive: true },
      { name: 'Printing', categoryId: categories[0]._id, isActive: true },
      { name: 'Software', categoryId: categories[0]._id, isActive: true },
      { name: 'Electricity', categoryId: categories[1]._id, isActive: true },
      { name: 'Internet', categoryId: categories[1]._id, isActive: true },
      { name: 'Water', categoryId: categories[1]._id, isActive: true },
      { name: 'Office Rent', categoryId: categories[2]._id, isActive: true },
      { name: 'Equipment Maintenance', categoryId: categories[2]._id, isActive: true }
    ]);

    console.log('Created expense subcategories:', subcategories);

    // Create sample expenses
    const expenses = await Expense.insertMany([
      {
        expenseNo: 'EXP-0001',
        categoryId: categories[0]._id,
        subCategoryId: subcategories[0]._id,
        amount: 1500,
        date: new Date('2024-01-15'),
        description: 'Office stationery purchase',
        paymentMethod: 'cash'
      },
      {
        expenseNo: 'EXP-0002',
        categoryId: categories[1]._id,
        subCategoryId: subcategories[3]._id,
        amount: 3500,
        date: new Date('2024-01-20'),
        description: 'Monthly electricity bill',
        paymentMethod: 'bank_transfer'
      },
      {
        expenseNo: 'EXP-0003',
        categoryId: categories[2]._id,
        subCategoryId: subcategories[6]._id,
        amount: 12000,
        date: new Date('2024-01-01'),
        description: 'Monthly office rent',
        paymentMethod: 'bank_transfer'
      }
    ]);

    console.log('Created sample expenses:', expenses);

    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedExpenses();
