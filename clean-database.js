require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧹 Cleaning MongoDB database...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      try {
        await collection.drop();
        console.log(`✅ Dropped collection: ${collection.collectionName}`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${collection.collectionName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Database cleaned successfully!');
    console.log('✅ Ready for fresh data insertion');
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
