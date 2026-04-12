require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const SubService = require('./models/SubService');

console.log('Creating sample services and sub-services for testing...');

const createSampleServicesData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing services and sub-services
    await Service.deleteMany({});
    await SubService.deleteMany({});
    console.log('Cleared existing data');

    // Create sample services
    const services = [
      { serviceName: 'Printer Repair', description: 'Complete printer repair and maintenance services' },
      { serviceName: 'Computer Repair', description: 'Computer hardware and software repair' },
      { serviceName: 'Network Setup', description: 'Network installation and configuration' },
      { serviceName: 'Software Installation', description: 'Professional software setup and installation' },
      { serviceName: 'Hardware Maintenance', description: 'Regular hardware maintenance and checkups' }
    ];

    const createdServices = await Service.insertMany(services);
    console.log(`Created ${createdServices.length} services`);

    // Create sample sub-services
    const subServices = [
      // Printer Repair sub-services
      { subServiceName: 'Cartridge Replacement', serviceId: createdServices[0]._id, price: 500, unit: 'piece' },
      { subServiceName: 'Drum Unit Replacement', serviceId: createdServices[0]._id, price: 1500, unit: 'piece' },
      { subServiceName: 'Fuser Unit Repair', serviceId: createdServices[0]._id, price: 2000, unit: 'service' },
      { subServiceName: 'Paper Jam Fix', serviceId: createdServices[0]._id, price: 300, unit: 'service' },
      
      // Computer Repair sub-services
      { subServiceName: 'Virus Removal', serviceId: createdServices[1]._id, price: 800, unit: 'service' },
      { subServiceName: 'Hardware Upgrade', serviceId: createdServices[1]._id, price: 1200, unit: 'service' },
      { subServiceName: 'Data Recovery', serviceId: createdServices[1]._id, price: 2000, unit: 'service' },
      { subServiceName: 'OS Installation', serviceId: createdServices[1]._id, price: 1000, unit: 'service' },
      
      // Network Setup sub-services
      { subServiceName: 'Router Configuration', serviceId: createdServices[2]._id, price: 1500, unit: 'service' },
      { subServiceName: 'Network Cable Installation', serviceId: createdServices[2]._id, price: 500, unit: 'meter' },
      { subServiceName: 'WiFi Setup', serviceId: createdServices[2]._id, price: 800, unit: 'service' },
      
      // Software Installation sub-services
      { subServiceName: 'Office Suite Setup', serviceId: createdServices[3]._id, price: 600, unit: 'service' },
      { subServiceName: 'Antivirus Installation', serviceId: createdServices[3]._id, price: 400, unit: 'service' },
      { subServiceName: 'Driver Installation', serviceId: createdServices[3]._id, price: 300, unit: 'service' },
      
      // Hardware Maintenance sub-services
      { subServiceName: 'System Cleaning', serviceId: createdServices[4]._id, price: 400, unit: 'service' },
      { subServiceName: 'Thermal Paste Replacement', serviceId: createdServices[4]._id, price: 600, unit: 'service' },
      { subServiceName: 'Component Testing', serviceId: createdServices[4]._id, price: 500, unit: 'service' }
    ];

    const createdSubServices = await SubService.insertMany(subServices);
    console.log(`Created ${createdSubServices.length} sub-services`);

    console.log('\nSample data created successfully!');
    console.log('Services:', createdServices.map(s => s.serviceName));
    console.log('Sub-services per service:', createdServices.map(s => 
      createdSubServices.filter(sub => sub.serviceId.toString() === s._id.toString()).length
    ));

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
};

createSampleServicesData();
