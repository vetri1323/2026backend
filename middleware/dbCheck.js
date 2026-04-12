const mongoose = require('mongoose');

// Middleware to check database connection status and provide mock data if needed
const dbCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // Database not connected, provide mock data
    console.log('Database not connected, providing mock data for:', req.path);
    
    // Mock data for different endpoints
    const mockResponses = {
      '/api/machines': [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Brother Printer 1',
          brand: 'Brother',
          modelNumber: 'HL-L2350DW',
          installationDate: '2024-01-15',
          serviceCenterDetails: 'Brother Service Center',
          warrantyStartDate: '2024-01-15',
          warrantyExpiryDate: '2025-01-15',
          status: 'Active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'HP Printer 2',
          brand: 'HP',
          modelNumber: 'LaserJet Pro M404n',
          installationDate: '2024-02-20',
          serviceCenterDetails: 'HP Service Center',
          warrantyStartDate: '2024-02-20',
          warrantyExpiryDate: '2025-02-20',
          status: 'Active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      '/api/customers': [
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
          address: '123 Main St, City',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439014',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '9876543211',
          address: '456 Oak Ave, Town',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      '/api/readings': [
        {
          _id: '507f1f77bcf86cd799439015',
          machineId: '507f1f77bcf86cd799439011',
          date: new Date(),
          currentCount: 1500,
          previousCount: 1000,
          totalPrints: 500,
          remarks: 'Regular reading',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      '/api/maintenance': [
        {
          _id: '507f1f77bcf86cd799439016',
          machineId: '507f1f77bcf86cd799439011',
          serviceDate: new Date(),
          serviceType: 'General Service',
          technicianName: 'Tech John',
          nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          remarks: 'Regular maintenance',
          cost: 500,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      '/api/expenses': [
        {
          _id: '507f1f77bcf86cd799439017',
          expenseNo: 'EXP-0001',
          categoryId: '507f1f77bcf86cd799439018',
          subCategoryId: '507f1f77bcf86cd799439019',
          amount: 1500,
          date: new Date(),
          description: 'Office supplies',
          paymentMethod: 'cash',
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      '/api/bills': [
        {
          _id: '507f1f77bcf86cd799439020',
          billNo: 'BILL-0001',
          customerId: '507f1f77bcf86cd799439013',
          items: [],
          subtotal: 2000,
          tax: 200,
          total: 2200,
          status: 'paid',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      '/api/dashboard/summary': {
        totalMachines: 2,
        activeMachines: 2,
        totalCustomers: 2,
        todaySales: 2200,
        monthlySales: 15000,
        totalExpenses: 1500,
        pendingMaintenance: 1,
        recentReadings: 1
      },
      '/api/profit-loss': [
        {
          _id: '507f1f77bcf86cd799439030',
          period: 'monthly',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
          revenue: {
            total: 15000,
            breakdown: [
              {
                source: 'Sales',
                amount: 15000,
                description: 'Revenue from paid bills'
              }
            ]
          },
          expenses: {
            total: 3500,
            breakdown: [
              {
                categoryId: '507f1f77bcf86cd799439031',
                categoryName: 'Operating Expenses',
                amount: 2000,
                subcategories: [
                  {
                    subCategoryId: '507f1f77bcf86cd799439032',
                    subcategoryName: 'Office Supplies',
                    amount: 1500
                  },
                  {
                    subCategoryId: '507f1f77bcf86cd799439033',
                    subcategoryName: 'Utilities',
                    amount: 500
                  }
                ]
              },
              {
                categoryId: '507f1f77bcf86cd799439034',
                categoryName: 'Maintenance',
                amount: 1500,
                subcategories: [
                  {
                    subCategoryId: '507f1f77bcf86cd799439035',
                    subcategoryName: 'Equipment Maintenance',
                    amount: 1500
                  }
                ]
              }
            ]
          },
          grossProfit: 11500,
          netProfit: 11500,
          profitMargin: 76.67,
          status: 'draft',
          generatedAt: new Date(),
          notes: 'Sample profit & loss statement for demonstration'
        }
      ],
      '/api/profit-loss/summary/latest': {
        _id: '507f1f77bcf86cd799439030',
        period: 'monthly',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
        revenue: {
          total: 15000,
          breakdown: [
            {
              source: 'Sales',
              amount: 15000,
              description: 'Revenue from paid bills'
            }
          ]
        },
        expenses: {
          total: 3500,
          breakdown: [
            {
              categoryId: '507f1f77bcf86cd799439031',
              categoryName: 'Operating Expenses',
              amount: 2000,
              subcategories: [
                {
                  subCategoryId: '507f1f77bcf86cd799439032',
                  subcategoryName: 'Office Supplies',
                  amount: 1500
                },
                {
                  subCategoryId: '507f1f77bcf86cd799439033',
                  subcategoryName: 'Utilities',
                  amount: 500
                }
              ]
            },
            {
              categoryId: '507f1f77bcf86cd799439034',
              categoryName: 'Maintenance',
              amount: 1500,
              subcategories: [
                {
                  subCategoryId: '507f1f77bcf86cd799439035',
                  subcategoryName: 'Equipment Maintenance',
                  amount: 1500
                }
              ]
            }
          ]
        },
        grossProfit: 11500,
        netProfit: 11500,
        profitMargin: 76.67,
        status: 'draft',
        generatedAt: new Date(),
        notes: 'Sample profit & loss statement for demonstration'
      }
    };

    // Check if we have mock data for this endpoint
    const mockData = mockResponses[req.path];
    if (mockData) {
      return res.json(mockData);
    }

    // For specific endpoints with IDs
    if (req.path.includes('/api/machines/') && req.params.id) {
      const machine = mockResponses['/api/machines'].find(m => m._id === req.params.id);
      if (machine) return res.json(machine);
    }

    if (req.path.includes('/api/customers/') && req.params.id) {
      const customer = mockResponses['/api/customers'].find(c => c._id === req.params.id);
      if (customer) return res.json(customer);
    }

    if (req.path.includes('/api/profit-loss/') && req.params.id) {
      const profitLoss = mockResponses['/api/profit-loss'].find(p => p._id === req.params.id);
      if (profitLoss) return res.json(profitLoss);
    }

    // Default response for unknown endpoints
    return res.json([]);
  }
  
  // Database is connected, proceed to next middleware
  next();
};

module.exports = dbCheck;
