const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const Coupon = require('./models/Coupon');

// Load environment variables
dotenv.config();

// Admin credentials
const adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

// Sample coupons
const sampleCoupons = [
  {
    code: 'SAVE10',
    description: '10% off on your first purchase',
    isActive: true
  },
  {
    code: 'SUMMER25',
    description: '25% off on summer collection',
    isActive: true
  },
  {
    code: 'FREESHIP',
    description: 'Free shipping on orders over $50',
    isActive: true
  },
  {
    code: 'WELCOME15',
    description: '15% discount for new customers',
    isActive: true
  },
  {
    code: 'FLASH50',
    description: '50% off flash sale (limited time)',
    isActive: true
  },
  {
    code: 'HOLIDAY20',
    description: '20% off for holiday season',
    isActive: true
  },
  {
    code: 'LOYALTY30',
    description: '30% off for loyal customers',
    isActive: true
  },
  {
    code: 'BIRTHDAY25',
    description: '25% off birthday special',
    isActive: true
  },
  {
    code: 'APP15',
    description: '15% off when ordering through our app',
    isActive: true
  },
  {
    code: 'WEEKEND10',
    description: '10% off weekend special',
    isActive: true
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if admin already exists
      const adminCount = await Admin.countDocuments();
      
      if (adminCount === 0) {
        // Create admin account
        const admin = new Admin(adminCredentials);
        await admin.save();
        console.log('Admin account created successfully');
      } else {
        console.log('Admin account already exists');
      }
      
      // Check if coupons already exist
      const couponCount = await Coupon.countDocuments();
      
      if (couponCount === 0) {
        // Create sample coupons
        await Coupon.insertMany(sampleCoupons);
        console.log(`${sampleCoupons.length} sample coupons created successfully`);
      } else {
        console.log('Coupons already exist in the database');
      }
      
      console.log('Setup completed successfully');
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      // Disconnect from MongoDB
      mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  }); 