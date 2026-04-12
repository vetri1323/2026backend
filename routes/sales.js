const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const BillItem = require('../models/BillItem');
const Customer = require('../models/Customer');
const SubService = require('../models/SubService');
const Service = require('../models/Service');

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { customerId, billNo, status, startDate, endDate } = req.query;
    let query = {};
    
    if (customerId) query.customerId = customerId;
    if (billNo) query.billNo = { $regex: billNo, $options: 'i' };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }
    
    const bills = await Bill.find(query)
      .populate('customerId', 'name cellNo emailId')
      .sort({ createdAt: -1 });
    
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bill by ID
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customerId', 'name cellNo emailId address');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Get bill items
    const billItems = await BillItem.find({ billId: req.params.id })
      .populate('serviceId', 'serviceName')
      .populate('subServiceId', 'subServiceName price unit');
    
    res.json({ bill, items: billItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new bill
router.post('/', async (req, res) => {
  try {
    const { bill, items } = req.body;
    
    // Generate bill number
    const lastBill = await Bill.findOne().sort({ billNo: -1 });
    const billNo = lastBill ? `BILL${String(parseInt(lastBill.billNo.replace('BILL', '')) + 1).padStart(4, '0')}` : 'BILL0001';
    
    // Get services and sub-services for reference
    const services = await Service.find();
    const subServices = await SubService.find().populate('serviceId');
    
    // Create bill
    const newBill = new Bill({
      ...bill,
      billNo,
      subtotal: 0,
      grandTotal: 0
    });
    
    // Calculate totals from items
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unitPrice;
    }
    
    newBill.subtotal = subtotal;
    newBill.grandTotal = subtotal + (bill.serviceCharges || 0) - (bill.discount || 0);
    
    const savedBill = await newBill.save();
    
    // Create bill items
    const billItems = items.map(item => {
      const subService = subServices.find(ss => ss._id.toString() === item.subServiceId.toString());
      const service = subService && subService.serviceId ? 
        services.find(s => s._id.toString() === subService.serviceId._id.toString()) : null;
      
      return {
        ...item,
        billId: savedBill._id,
        amount: item.quantity * item.unitPrice,
        serviceName: service ? service.serviceName : '',
        subServiceName: subService ? subService.subServiceName : '',
        unit: subService ? subService.unit : 'unit'
      };
    });
    
    await BillItem.insertMany(billItems);
    
    // Populate and return
    const populatedBill = await Bill.findById(savedBill._id)
      .populate('customerId', 'name cellNo emailId address');
    
    const populatedItems = await BillItem.find({ billId: savedBill._id })
      .populate('serviceId', 'serviceName')
      .populate('subServiceId', 'subServiceName price unit');
    
    res.status(201).json({ bill: populatedBill, items: populatedItems });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update bill
router.put('/:id', async (req, res) => {
  try {
    const { bill, items } = req.body;
    
    const existingBill = await Bill.findById(req.params.id);
    if (!existingBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Update bill
    Object.assign(existingBill, bill);
    
    // Recalculate totals if items provided
    if (items) {
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.unitPrice;
      }
      
      existingBill.subtotal = subtotal;
      existingBill.grandTotal = subtotal + (bill.serviceCharges || 0) - (bill.discount || 0);
      
      // Update bill items
      await BillItem.deleteMany({ billId: req.params.id });
      
      const billItems = items.map(item => ({
        ...item,
        billId: req.params.id,
        amount: item.quantity * item.unitPrice
      }));
      
      await BillItem.insertMany(billItems);
    }
    
    const updatedBill = await existingBill.save();
    
    // Populate and return
    const populatedBill = await Bill.findById(updatedBill._id)
      .populate('customerId', 'name cellNo emailId address');
    
    const populatedItems = await BillItem.find({ billId: updatedBill._id })
      .populate('serviceId', 'serviceName')
      .populate('subServiceId', 'subServiceName price unit');
    
    res.json({ bill: populatedBill, items: populatedItems });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete bill
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Delete bill items first
    await BillItem.deleteMany({ billId: req.params.id });
    
    // Then delete bill
    await Bill.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search customers for billing
router.get('/search/customers', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    
    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { customerId: { $regex: q, $options: 'i' } },
        { cellNo: { $regex: q, $options: 'i' } },
        { emailId: { $regex: q, $options: 'i' } }
      ]
    }).limit(10).select('name customerId cellNo emailId address');
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sub-services for billing
router.get('/services/subservices', async (req, res) => {
  try {
    const { serviceId } = req.query;
    let query = {};
    if (serviceId) {
      query.serviceId = serviceId;
    }
    
    const subServices = await SubService.find(query)
      .populate('serviceId', 'serviceName')
      .sort({ subServiceName: 1 });
    
    res.json(subServices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
