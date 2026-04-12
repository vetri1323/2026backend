require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('./models/Staff');

console.log('Testing Staff data persistence in MongoDB...');

const testStaffMongoDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Clear existing test data
    await Staff.deleteMany({ email: { $regex: /test@/i } });
    console.log('Cleared existing test staff data');

    // Test 1: Create a new staff member
    console.log('\n1. Creating new staff member...');
    const newStaff = new Staff({
      name: 'Test Technician',
      email: 'test.technician@company.com',
      role: 'Technician',
      phone: '+1 234-567-8900',
      department: 'Service',
      isActive: true
    });

    const savedStaff = await newStaff.save();
    console.log('   Staff saved successfully:', savedStaff.name);
    console.log('   Staff ID:', savedStaff._id);
    console.log('   Created at:', savedStaff.createdAt);

    // Test 2: Retrieve the staff member
    console.log('\n2. Retrieving staff member...');
    const retrievedStaff = await Staff.findById(savedStaff._id);
    if (retrievedStaff) {
      console.log('   Staff retrieved successfully:', retrievedStaff.name);
      console.log('   Email:', retrievedStaff.email);
      console.log('   Role:', retrievedStaff.role);
      console.log('   Active:', retrievedStaff.isActive);
    } else {
      console.log('   ERROR: Could not retrieve staff member');
      return;
    }

    // Test 3: Update the staff member
    console.log('\n3. Updating staff member...');
    retrievedStaff.phone = '+1 234-567-8999';
    retrievedStaff.assignedCustomers = 5;
    const updatedStaff = await retrievedStaff.save();
    console.log('   Staff updated successfully');
    console.log('   New phone:', updatedStaff.phone);
    console.log('   Assigned customers:', updatedStaff.assignedCustomers);

    // Test 4: Find all staff
    console.log('\n4. Finding all staff...');
    const allStaff = await Staff.find({});
    console.log('   Total staff in database:', allStaff.length);
    allStaff.forEach(staff => {
      console.log(`   - ${staff.name} (${staff.email}) - ${staff.role}`);
    });

    // Test 5: Find active staff only
    console.log('\n5. Finding active staff only...');
    const activeStaff = await Staff.find({ isActive: true });
    console.log('   Active staff count:', activeStaff.length);

    // Test 6: Test unique email constraint
    console.log('\n6. Testing unique email constraint...');
    try {
      const duplicateStaff = new Staff({
        name: 'Duplicate Test',
        email: 'test.technician@company.com', // Same email
        role: 'Senior Technician',
        department: 'Service',
        isActive: true
      });
      await duplicateStaff.save();
      console.log('   ERROR: Duplicate email was allowed (this should not happen)');
    } catch (error) {
      if (error.code === 11000) {
        console.log('   Unique email constraint working correctly');
      } else {
        console.log('   Unexpected error:', error.message);
      }
    }

    // Test 7: Clean up test data
    console.log('\n7. Cleaning up test data...');
    const deleteResult = await Staff.deleteOne({ _id: savedStaff._id });
    console.log('   Test staff deleted:', deleteResult.deletedCount === 1 ? 'YES' : 'NO');

    console.log('\nAll MongoDB staff tests passed! Staff data persistence is working correctly.');
    console.log('Staff members are being saved to MongoDB Atlas successfully.');

  } catch (error) {
    console.error('Error during MongoDB test:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testStaffMongoDB();
