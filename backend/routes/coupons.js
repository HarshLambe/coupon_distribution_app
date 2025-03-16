const express = require('express');
const Coupon = require('../models/Coupon');
const UserClaim = require('../models/UserClaim');
const { authenticateAdmin } = require('../middleware/auth');
const { captureUserInfo } = require('../middleware/auth');
const { claimRateLimiter, checkPreviousClaims } = require('../middleware/rateLimiter');

const router = express.Router();

// ===== PUBLIC ROUTES =====

// Claim a coupon (round-robin distribution)
router.post('/claim', captureUserInfo, claimRateLimiter, checkPreviousClaims, async (req, res) => {
  try {
    // Find the next available coupon (first unclaimed, active coupon)
    const nextCoupon = await Coupon.findOne({
      isActive: true,
      isClaimed: false
    }).sort({ createdAt: 1 }); // Get oldest coupon first (FIFO)
    
    if (!nextCoupon) {
      // Count total coupons to provide more context
      const totalCoupons = await Coupon.countDocuments();
      const claimedCoupons = await Coupon.countDocuments({ isClaimed: true });
      
      return res.status(404).json({ 
        message: 'No coupons available at this time',
        details: {
          totalCoupons,
          claimedCoupons,
          availableCoupons: 0
        }
      });
    }
    
    // Create user claim record
    const userClaim = new UserClaim({
      ipAddress: req.userInfo.ipAddress,
      browserFingerprint: req.userInfo.browserFingerprint,
      coupon: nextCoupon._id
    });
    
    await userClaim.save();
    
    // Update coupon as claimed
    nextCoupon.isClaimed = true;
    nextCoupon.claimedBy = userClaim._id;
    await nextCoupon.save();
    
    res.status(200).json({
      message: 'Coupon claimed successfully',
      coupon: {
        code: nextCoupon.code,
        description: nextCoupon.description
      }
    });
  } catch (error) {
    console.error('Coupon claim error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ADMIN ROUTES =====

// Get all coupons (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get coupon details with claim info (admin only)
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('claimedBy');
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.status(200).json(coupon);
  } catch (error) {
    console.error('Get coupon details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new coupon (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { code, description, isActive } = req.body;
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    
    // Create new coupon
    const coupon = new Coupon({
      code,
      description,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await coupon.save();
    
    res.status(201).json({
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add multiple coupons (admin only)
router.post('/batch', authenticateAdmin, async (req, res) => {
  try {
    const { coupons } = req.body;
    
    if (!Array.isArray(coupons) || coupons.length === 0) {
      return res.status(400).json({ message: 'Invalid coupons data' });
    }
    
    // Filter out coupons with duplicate codes
    const uniqueCodes = new Set();
    const validCoupons = [];
    
    for (const coupon of coupons) {
      if (!uniqueCodes.has(coupon.code)) {
        uniqueCodes.add(coupon.code);
        validCoupons.push({
          code: coupon.code,
          description: coupon.description,
          isActive: coupon.isActive !== undefined ? coupon.isActive : true
        });
      }
    }
    
    // Check for existing codes in database
    const existingCodes = await Coupon.find({
      code: { $in: Array.from(uniqueCodes) }
    }).distinct('code');
    
    const newCoupons = validCoupons.filter(coupon => !existingCodes.includes(coupon.code));
    
    if (newCoupons.length === 0) {
      return res.status(400).json({ message: 'All coupon codes already exist' });
    }
    
    // Insert new coupons
    const result = await Coupon.insertMany(newCoupons);
    
    res.status(201).json({
      message: `${result.length} coupons created successfully`,
      duplicatesSkipped: validCoupons.length - result.length + (coupons.length - validCoupons.length)
    });
  } catch (error) {
    console.error('Batch create coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update coupon (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { code, description, isActive } = req.body;
    
    // Find coupon
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    // Check if updating to an existing code
    if (code && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
      coupon.code = code;
    }
    
    // Update fields
    if (description !== undefined) coupon.description = description;
    if (isActive !== undefined) coupon.isActive = isActive;
    
    await coupon.save();
    
    res.status(200).json({
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete coupon (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    // Check if coupon is claimed
    if (coupon.isClaimed) {
      return res.status(400).json({ message: 'Cannot delete a claimed coupon' });
    }
    
    await coupon.deleteOne();
    
    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add test coupons (admin only)
router.post('/test-coupons', authenticateAdmin, async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const testCoupons = [];
    
    for (let i = 0; i < count; i++) {
      const randomCode = 'TEST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      testCoupons.push({
        code: randomCode,
        description: `Test coupon ${i+1}`,
        isActive: true,
        isClaimed: false
      });
    }
    
    const result = await Coupon.insertMany(testCoupons);
    
    res.status(201).json({
      message: `${result.length} test coupons created successfully`,
      coupons: result
    });
  } catch (error) {
    console.error('Create test coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
