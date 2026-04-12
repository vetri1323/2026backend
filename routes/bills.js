const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const BillItem = require('../models/BillItem');
const mongoose = require('mongoose');

// GET all bills
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    
    // Build query object
    let query = {};
    
    // Add date range filter
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }
    
    // Add payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    const bills = await Bill.find(query)
      .populate('customerId', 'name cellNo customerId')
      .sort({ billDate: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single bill with items
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customerId', 'name cellNo customerId address pincode emailId');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const billItems = await BillItem.find({ billId: req.params.id })
      .populate('serviceId', 'serviceName')
      .populate('subServiceId', 'subServiceName');

    res.json({
      bill,
      items: billItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new bill
router.post('/', async (req, res) => {
  try {
    const {
      billNo,
      customerId,
      customerName,
      customerAddress,
      billDate,
      subtotal,
      serviceCharges,
      discount,
      grandTotal,
      paymentMethod,
      transactionNo,
      upiId,
      notes,
      customerType,
      items
    } = req.body;

    // Check if bill number already exists
    const existingBill = await Bill.findOne({ billNo });
    if (existingBill) {
      return res.status(400).json({ message: 'Bill number already exists' });
    }

    // Create new bill
    const newBill = new Bill({
      billNo,
      customerId,
      customerName,
      customerAddress,
      billDate: new Date(billDate),
      subtotal,
      serviceCharges,
      discount,
      grandTotal,
      paymentMethod,
      transactionNo,
      upiId,
      notes,
      customerType,
      status: 'pending'
    });

    const savedBill = await newBill.save();

    // Create bill items
    const billItems = items.map(item => ({
      billId: savedBill._id,
      serviceId: item.serviceId,
      subServiceId: item.subServiceId,
      serviceName: item.serviceName,
      subServiceName: item.subServiceName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: item.unit,
      amount: item.amount,
      // New stock detail fields
      category: item.category || '',
      subCategory: item.subCategory || '',
      totalStock: item.totalStock || 0,
      // New counting fields
      sheetCount: item.sheetCount || 0,
      wastCount: item.wastCount || 0,
      totalCount: item.totalCount || 0,
      // New text field
      text: item.text || '',
      // GST field
      gst: item.gst || 0
    }));

    const savedBillItems = await BillItem.insertMany(billItems);

    res.status(201).json({
      bill: savedBill,
      items: savedBillItems
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT update bill
router.put('/:id', async (req, res) => {
  try {
    const {
      customerName,
      customerAddress,
      billDate,
      subtotal,
      serviceCharges,
      discount,
      grandTotal,
      paymentMethod,
      transactionNo,
      upiId,
      notes,
      customerType,
      status,
      items
    } = req.body;

    // Update bill
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        customerAddress,
        billDate: new Date(billDate),
        subtotal,
        serviceCharges,
        discount,
        grandTotal,
        paymentMethod,
        transactionNo,
        upiId,
        notes,
        customerType,
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Delete existing bill items
    await BillItem.deleteMany({ billId: req.params.id });

    // Create new bill items
    const billItems = items.map(item => ({
      billId: updatedBill._id,
      serviceId: item.serviceId,
      subServiceId: item.subServiceId,
      serviceName: item.serviceName,
      subServiceName: item.subServiceName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: item.unit,
      amount: item.amount,
      // New stock detail fields
      category: item.category || '',
      subCategory: item.subCategory || '',
      totalStock: item.totalStock || 0,
      // New counting fields
      sheetCount: item.sheetCount || 0,
      wastCount: item.wastCount || 0,
      totalCount: item.totalCount || 0,
      // New text field
      text: item.text || '',
      // GST field
      gst: item.gst || 0
    }));

    const savedBillItems = await BillItem.insertMany(billItems);

    res.json({
      bill: updatedBill,
      items: savedBillItems
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE bill
router.delete('/:id', async (req, res) => {
  try {
    // Delete bill items first
    await BillItem.deleteMany({ billId: req.params.id });

    // Delete bill
    const deletedBill = await Bill.findByIdAndDelete(req.params.id);

    if (!deletedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET bills by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const bills = await Bill.find({ customerId: req.params.customerId })
      .populate('customerId', 'name cellNo customerId')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET bills by date range
router.get('/date-range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const bills = await Bill.find({
      billDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('customerId', 'name cellNo customerId')
      .sort({ billDate: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET today's bills
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const bills = await Bill.find({
      billDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
      .populate('customerId', 'name cellNo customerId')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
