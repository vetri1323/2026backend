const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saha', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create vetrivel admin user
const createVetrivelAdmin = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      console.log('Deleting existing admin to create new one...');
      await User.findByIdAndDelete(existingAdmin._id);
    }
    
    // Create vetrivel admin user
    const adminUser = new User({
      username: 'vetri@gmail.com',
      email: 'vetri@gmail.com',
      password: 'vetri@gmail.com',
      pin: '1323',
      role: 'admin',
      fullName: 'vetrivel',
      phone: '',
      status: 'active',
      permissions: {
        dashboard: true,
        customers: true,
        reminders: true,
        billing: true,
        settings: true
      }
    });
    
    await adminUser.save();
    console.log('Admin user "vetrivel" created successfully!');
    console.log('=====================================');
    console.log('Login Details:');
    console.log('Username: vetri@gmail.com');
    console.log('Password: vetri@gmail.com');
    console.log('PIN: 1323');
    console.log('Full Name: vetrivel');
    console.log('Role: admin');
    console.log('=====================================');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Main function
const main = async () => {
  console.log('Creating vetrivel admin user...');
  
  await connectDB();
  await createVetrivelAdmin();
  
  console.log('Admin user creation completed!');
  
  // Close connection
  mongoose.connection.close();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Admin creation failed:', error);
    process.exit(1);
  });
}

module.exports = { createVetrivelAdmin };
