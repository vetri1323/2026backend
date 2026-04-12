require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
    
    // Test database operations
    const testDB = async () => {
      try {
        // Test creating a simple document
        const testSchema = new mongoose.Schema({
          name: String,
          timestamp: { type: Date, default: Date.now }
        });
        const TestModel = mongoose.model('Test', testSchema);
        
        const testDoc = new TestModel({ name: 'Connection Test' });
        await testDoc.save();
        console.log('✅ Document saved successfully');
        
        const docs = await TestModel.find();
        console.log('✅ Documents retrieved:', docs.length);
        
        await TestModel.deleteMany({});
        console.log('✅ Test documents cleaned up');
        
        console.log('✅ All database operations working correctly');
        process.exit(0);
      } catch (error) {
        console.error('❌ Database operations failed:', error.message);
        process.exit(1);
      }
    };
    
    testDB();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
