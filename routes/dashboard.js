const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const Reading = require('../models/Reading');
const Maintenance = require('../models/Maintenance');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Expense = require('../models/Expense');

// Get dashboard summary data
router.get('/summary', async (req, res) => {
  try {
    // Get total machines count
    const totalMachines = await Machine.countDocuments();

    // Get total customers count
    const totalCustomers = await Customer.countDocuments();

    // Get today's readings count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayReadings = await Reading.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // Get pending maintenance alerts
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + 3); // Next 3 days
    
    const pendingMaintenance = await Maintenance.countDocuments({
      nextServiceDate: { $lte: alertDate }
    });

    // Get financial data
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Total income from bills this month
    const monthlyIncome = await Bill.aggregate([
      { $match: { billDate: { $gte: currentMonth, $lt: nextMonth } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // Total expenses this month
    const monthlyExpenses = await Expense.aggregate([
      { $match: { date: { $gte: currentMonth, $lt: nextMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get recent activities (last 10 records)
    const recentReadings = await Reading.find()
      .populate('machineId', 'name')
      .sort({ createdAt: -1 })
      .limit(3);

    const recentMaintenance = await Maintenance.find()
      .populate('machineId', 'name')
      .sort({ createdAt: -1 })
      .limit(3);

    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(3);

    const recentBills = await Bill.find()
      .sort({ createdAt: -1 })
      .limit(2);

    // Combine and sort recent activities
    const recentActivities = [
      ...recentReadings.map(r => ({
        type: 'reading',
        description: r.machineId ? `Daily reading added for ${r.machineId.name}` : 'Daily reading added',
        date: r.createdAt,
        details: `Count: ${r.currentCount}, Prints: ${r.totalPrints}`
      })),
      ...recentMaintenance.map(m => ({
        type: 'maintenance',
        description: m.machineId ? `${m.serviceType} performed on ${m.machineId.name}` : `${m.serviceType} performed`,
        date: m.createdAt,
        details: m.technicianName ? `Technician: ${m.technicianName}` : 'No technician assigned'
      })),
      ...recentCustomers.map(c => ({
        type: 'customer',
        description: `New customer registered: ${c.name}`,
        date: c.createdAt,
        details: `ID: ${c.customerId}, Phone: ${c.cellNo}`
      })),
      ...recentBills.map(b => ({
        type: 'bill',
        description: b.customerName ? `Bill generated for ${b.customerName}` : 'Bill generated',
        date: b.createdAt,
        details: b.grandTotal ? `Amount: ₹${b.grandTotal}, Bill No: ${b.billNo}` : 'Amount: ₹0, Bill No: N/A'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    // Get maintenance alerts with priority
    const maintenanceAlerts = await Maintenance.find({
      nextServiceDate: { $lte: alertDate }
    })
    .populate('machineId', 'name brand modelNumber')
    .sort({ nextServiceDate: 1 });
    
    const alerts = maintenanceAlerts.map(record => {
      const daysUntilService = Math.ceil((record.nextServiceDate - new Date()) / (1000 * 60 * 60 * 24));
      let priority = 'low';
      
      if (daysUntilService <= 1) priority = 'high';
      else if (daysUntilService <= 3) priority = 'medium';

      return {
        machineName: record.machineId ? record.machineId.name : 'Unknown Machine',
        serviceType: record.serviceType,
        nextServiceDate: record.nextServiceDate,
        daysUntilService,
        priority
      };
    });

    res.json({
      summary: {
        totalMachines,
        totalCustomers,
        todayReadings,
        pendingMaintenance,
        monthlyIncome: monthlyIncome[0]?.total || 0,
        monthlyExpenses: monthlyExpenses[0]?.total || 0,
        netProfit: (monthlyIncome[0]?.total || 0) - (monthlyExpenses[0]?.total || 0)
      },
      tasks: {
        pending: {
          total: pendingMaintenance,
          urgent: await Maintenance.countDocuments({ nextServiceDate: { $lte: new Date(Date.now() + 24*60*60*1000) } }),
          due: await Maintenance.countDocuments({ nextServiceDate: { $lte: new Date(Date.now() + 3*24*60*60*1000), $gt: new Date(Date.now() + 24*60*60*1000) } })
        },
        processing: {
          total: await Bill.countDocuments({ status: 'pending' }),
          review: await Bill.countDocuments({ status: 'review' })
        },
        complete: {
          total: await Bill.countDocuments({ status: 'paid' }),
          today: await Bill.countDocuments({ 
            status: 'paid', 
            createdAt: { $gte: today, $lt: tomorrow } 
          }),
          week: await Bill.countDocuments({ 
            status: 'paid', 
            createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } 
          })
        }
      },
      recentActivities,
      alerts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get machine status breakdown
router.get('/machine-status', async (req, res) => {
  try {
    const statusBreakdown = await Machine.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(statusBreakdown);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reading statistics for last 30 days
router.get('/reading-stats', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Reading.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalPrints: { $sum: '$totalPrints' },
          totalReadings: { $sum: 1 },
          avgPrintsPerDay: { $avg: '$totalPrints' }
        }
      }
    ]);

    res.json(stats[0] || { totalPrints: 0, totalReadings: 0, avgPrintsPerDay: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
