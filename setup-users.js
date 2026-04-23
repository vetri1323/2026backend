const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// MongoDB Connection
const connectDB = async () => {
  try {
    // Try primary MongoDB Atlas connection
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
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
      console.error('Local MongoDB connection failed:', localError.message);
      process.exit(1);
    }
  }
};

// Setup users collection
const setupUsers = async () => {
  try {
    console.log('Setting up users collection...');
    
    // Create default admin user
    const adminUser = await User.createDefaultAdmin();
    console.log('Default admin user created/verified:', {
      id: adminUser._id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status
    });
    
    // Create additional test users
    const testUsers = [
      {
        username: 'vetrigp',
        email: 'vetrigp@gmail.com',
        password: 'vetrigp123',
        pin: '1234',
        fullName: 'Vetri GP',
        phone: '9876543210',
        role: 'admin',
        status: 'active',
        permissions: {
          dashboard: true,
          customers: true,
          reminders: true,
          billing: true,
          settings: true,
          machines: true,
          reports: true
        },
        emailVerified: true
      },
      {
        username: 'staff1',
        email: 'staff1@example.com',
        password: 'staff123',
        pin: '5678',
        fullName: 'Staff Member One',
        phone: '9876543211',
        role: 'staff',
        status: 'active',
        permissions: {
          dashboard: true,
          customers: true,
          reminders: true,
          billing: false,
          settings: false,
          machines: false,
          reports: false
        },
        emailVerified: true
      },
      {
        username: 'manager1',
        email: 'manager1@example.com',
        password: 'manager123',
        pin: '9012',
        fullName: 'Manager One',
        phone: '9876543212',
        role: 'manager',
        status: 'active',
        permissions: {
          dashboard: true,
          customers: true,
          reminders: true,
          billing: true,
          settings: false,
          machines: true,
          reports: true
        },
        emailVerified: true
      }
    ];
    
    // Insert test users if they don't exist
    for (const userData of testUsers) {
      const existingUser = await User.findOne({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });
      
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Created test user: ${userData.username}`);
      } else {
        console.log(`Test user already exists: ${userData.username}`);
      }
    }
    
    // Display all users
    const allUsers = await User.find({})
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .sort({ createdAt: -1 });
    
    console.log('\n=== ALL USERS IN DATABASE ===');
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.fullName} (${user.username})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   PIN: ${user.pin || 'Not set'}`);
      console.log(`   Created: ${user.createdAt}`);
    });
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('1. Admin User:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   PIN: 1234');
    console.log('\n2. Vetri GP (Admin):');
    console.log('   Username: vetrigp');
    console.log('   Password: vetrigp123');
    console.log('   PIN: 1234');
    console.log('\n3. Staff User:');
    console.log('   Username: staff1');
    console.log('   Password: staff123');
    console.log('   PIN: 5678');
    console.log('\n4. Manager User:');
    console.log('   Username: manager1');
    console.log('   Password: manager123');
    console.log('   PIN: 9012');
    
    console.log('\n✅ Users collection setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up users:', error);
    process.exit(1);
  }
};

// Test authentication
const testAuth = async () => {
  try {
    console.log('\n=== TESTING AUTHENTICATION ===');
    
    // Test admin login
    console.log('\nTesting admin login...');
    const adminUser = await User.findByCredentials('admin', 'admin123');
    console.log('✅ Admin login successful:', adminUser.username);
    
    // Test staff login
    console.log('\nTesting staff login...');
    const staffUser = await User.findByCredentials('staff1', 'staff123');
    console.log('✅ Staff login successful:', staffUser.username);
    
    // Test invalid credentials
    console.log('\nTesting invalid credentials...');
    try {
      await User.findByCredentials('invalid', 'invalid');
    } catch (error) {
      console.log('✅ Invalid credentials properly rejected:', error.message);
    }
    
    console.log('\n✅ Authentication tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing authentication:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await setupUsers();
    await testAuth();
    
    console.log('\n🎉 MongoDB users collection setup and testing completed!');
    console.log('\nYou can now:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Login with the credentials above');
    console.log('3. Manage users through the frontend User Management page');
    
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

// Run setup
main();
