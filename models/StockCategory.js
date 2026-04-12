const mongoose = require('mongoose');

const stockCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  subcategories: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
stockCategorySchema.index({ name: 1 });
stockCategorySchema.index({ isActive: 1 });

// Virtual for subcategory count
stockCategorySchema.virtual('subcategoryCount').get(function() {
  return this.subcategories.length;
});

// Static methods
stockCategorySchema.statics.getDefaultCategories = function() {
  return [
    {
      name: 'Paper',
      description: 'Various types of paper for printing',
      subcategories: [
        { name: 'A4', description: 'Standard A4 paper size' },
        { name: 'A3', description: 'Standard A3 paper size' },
        { name: 'A5', description: 'Standard A5 paper size' },
        { name: 'Letter', description: 'US Letter paper size' },
        { name: 'Legal', description: 'US Legal paper size' },
        { name: 'Tabloid', description: 'Tabloid paper size' },
        { name: 'Photo Paper', description: 'Glossy photo paper' },
        { name: 'Cardstock', description: 'Heavy weight cardstock' },
        { name: 'Transparency', description: 'Transparent sheets' },
        { name: 'Label Paper', description: 'Adhesive label sheets' },
        { name: 'Newsprint', description: 'Newsprint paper' },
        { name: 'Art Paper', description: 'High quality art paper' },
        { name: 'Recycled Paper', description: 'Environmentally friendly paper' }
      ]
    },
    {
      name: 'Ink',
      description: 'Printing inks and toners',
      subcategories: [
        { name: 'Black', description: 'Black ink' },
        { name: 'Color', description: 'Color ink' },
        { name: 'Cyan', description: 'Cyan ink' },
        { name: 'Magenta', description: 'Magenta ink' },
        { name: 'Yellow', description: 'Yellow ink' },
        { name: 'Photo Black', description: 'Photo black ink' },
        { name: 'Matte Black', description: 'Matte black ink' },
        { name: 'Gray Ink', description: 'Gray ink' },
        { name: 'White Ink', description: 'White ink' },
        { name: 'Metallic Ink', description: 'Metallic finish ink' },
        { name: 'UV Ink', description: 'UV curable ink' },
        { name: 'Solvent Ink', description: 'Solvent based ink' },
        { name: 'Eco-Solvent Ink', description: 'Eco-friendly solvent ink' }
      ]
    },
    {
      name: 'Lamination',
      description: 'Lamination materials and films',
      subcategories: [
        { name: 'Matte', description: 'Matte lamination' },
        { name: 'Glossy', description: 'Glossy lamination' },
        { name: 'Satin', description: 'Satin lamination' },
        { name: 'Velvet', description: 'Velvet lamination' },
        { name: 'Textured', description: 'Textured lamination' },
        { name: 'Anti-Scratch', description: 'Anti-scratch lamination' },
        { name: 'UV Protection', description: 'UV protection lamination' },
        { name: 'Waterproof', description: 'Waterproof lamination' },
        { name: 'Heat Resistant', description: 'Heat resistant lamination' },
        { name: 'Cold Lamination', description: 'Cold lamination' },
        { name: 'Self-Adhesive', description: 'Self-adhesive lamination' }
      ]
    },
    {
      name: 'Binding',
      description: 'Binding materials and equipment',
      subcategories: [
        { name: 'Spiral', description: 'Spiral binding' },
        { name: 'Comb', description: 'Comb binding' },
        { name: 'Wire', description: 'Wire binding' },
        { name: 'Perfect Bound', description: 'Perfect bound binding' },
        { name: 'Saddle Stitch', description: 'Saddle stitch binding' },
        { name: 'Case Bound', description: 'Case bound binding' },
        { name: 'Thermal', description: 'Thermal binding' },
        { name: 'Coil', description: 'Coil binding' },
        { name: 'Plastic Coil', description: 'Plastic coil binding' },
        { name: 'Double Loop', description: 'Double loop binding' },
        { name: 'Twin Loop', description: 'Twin loop binding' }
      ]
    },
    {
      name: 'Printing Plates',
      description: 'Printing plates and materials',
      subcategories: [
        { name: 'Aluminum Plates', description: 'Aluminum printing plates' },
        { name: 'Polymer Plates', description: 'Polymer printing plates' },
        { name: 'Flexographic Plates', description: 'Flexographic printing plates' },
        { name: 'CTP Plates', description: 'CTP printing plates' },
        { name: 'Digital Plates', description: 'Digital printing plates' },
        { name: 'Screen Printing Plates', description: 'Screen printing plates' },
        { name: 'Offset Plates', description: 'Offset printing plates' }
      ]
    },
    {
      name: 'Chemicals',
      description: 'Printing chemicals and solutions',
      subcategories: [
        { name: 'Developer', description: 'Printing developer' },
        { name: 'Fixer', description: 'Printing fixer' },
        { name: 'Cleaning Solution', description: 'Cleaning solution' },
        { name: 'Fountain Solution', description: 'Fountain solution' },
        { name: 'Plate Cleaner', description: 'Plate cleaner' },
        { name: 'Blanket Wash', description: 'Blanket wash' },
        { name: 'Injet Cleaner', description: 'Inkjet cleaner' },
        { name: 'Toner', description: 'Toner' },
        { name: 'Drum Cleaner', description: 'Drum cleaner' }
      ]
    },
    {
      name: 'Tools',
      description: 'Printing tools and equipment',
      subcategories: [
        { name: 'Paper Cutter', description: 'Paper cutting tool' },
        { name: 'Guillotine', description: 'Guillotine cutter' },
        { name: 'Binding Machine', description: 'Binding machine' },
        { name: 'Laminator', description: 'Laminating machine' },
        { name: 'Folding Machine', description: 'Folding machine' },
        { name: 'Scoring Machine', description: 'Scoring machine' },
        { name: 'Perforator', description: 'Perforating machine' },
        { name: 'Creaser', description: 'Creasing machine' },
        { name: 'Corner Rounder', description: 'Corner rounding tool' }
      ]
    },
    {
      name: 'Packaging',
      description: 'Packaging materials and supplies',
      subcategories: [
        { name: 'Cardboard Boxes', description: 'Cardboard boxes' },
        { name: 'Bubble Wrap', description: 'Bubble wrap packaging' },
        { name: 'Shrink Wrap', description: 'Shrink wrap film' },
        { name: 'Foam Inserts', description: 'Foam packaging inserts' },
        { name: 'Paper Bags', description: 'Paper bags' },
        { name: 'Plastic Bags', description: 'Plastic bags' },
        { name: 'Envelopes', description: 'Envelopes' },
        { name: 'Mailers', description: 'Mailers' },
        { name: 'Tape', description: 'Packaging tape' },
        { name: 'Labels', description: 'Packaging labels' }
      ]
    }
  ];
};

module.exports = mongoose.model('StockCategory', stockCategorySchema);
