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

// Seed admin user
const seedAdmin = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }
    
    // Create default admin user
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
    console.log('Default admin user created successfully:');
    console.log('Username: vetri@gmail.com');
    console.log('Password: vetri@gmail.com');
    console.log('PIN: 1323');
    console.log('Email: vetri@gmail.com');
    console.log('Full Name: vetrivel');
    
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Create sample staff users
const seedSampleUsers = async () => {
  try {
    const sampleUsers = [
      {
        username: 'staff1',
        email: 'staff1@saha.com',
        password: 'staff123',
        pin: '1111',
        role: 'staff',
        fullName: 'John Staff',
        phone: '1234567890',
        status: 'active',
        permissions: {
          dashboard: true,
          customers: true,
          reminders: true,
          billing: false,
          settings: false
        }
      },
      {
        username: 'staff2',
        email: 'staff2@saha.com',
        password: 'staff123',
        pin: '2222',
        role: 'staff',
        fullName: 'Jane Staff',
        phone: '0987654321',
        status: 'active',
        permissions: {
          dashboard: true,
          customers: true,
          reminders: true,
          billing: true,
          settings: false
        }
      }
    ];
    
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });
      
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Sample user created: ${userData.username}`);
      }
    }
    
  } catch (error) {
    console.error('Error creating sample users:', error);
  }
};

// Main function
const main = async () => {
  console.log('Starting database seeding...');
  
  await connectDB();
  await seedAdmin();
  await seedSampleUsers();
  
  console.log('Database seeding completed!');
  
  // Close connection
  mongoose.connection.close();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedAdmin, seedSampleUsers };
