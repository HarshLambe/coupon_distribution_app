const express = require('express');
const UserClaim = require('../models/UserClaim');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are admin-only

// Get all user claims
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const claims = await UserClaim.find()
      .populate('coupon')
      .sort({ claimedAt: -1 });
    
    res.status(200).json(claims);
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get claims by IP address
router.get('/ip/:ipAddress', authenticateAdmin, async (req, res) => {
  try {
    const claims = await UserClaim.find({ ipAddress: req.params.ipAddress })
      .populate('coupon')
      .sort({ claimedAt: -1 });
    
    res.status(200).json(claims);
  } catch (error) {
    console.error('Get claims by IP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get claims by browser fingerprint
router.get('/browser/:fingerprint', authenticateAdmin, async (req, res) => {
  try {
    const claims = await UserClaim.find({ browserFingerprint: req.params.fingerprint })
      .populate('coupon')
      .sort({ claimedAt: -1 });
    
    res.status(200).json(claims);
  } catch (error) {
    console.error('Get claims by browser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get claim statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalClaims = await UserClaim.countDocuments();
    
    // Claims in the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const claimsLast24Hours = await UserClaim.countDocuments({
      claimedAt: { $gte: last24Hours }
    });
    
    // Claims in the last 7 days
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const claimsLast7Days = await UserClaim.countDocuments({
      claimedAt: { $gte: last7Days }
    });
    
    // Unique IPs
    const uniqueIPs = await UserClaim.distinct('ipAddress');
    
    // Unique browser fingerprints
    const uniqueBrowsers = await UserClaim.distinct('browserFingerprint');
    
    res.status(200).json({
      totalClaims,
      claimsLast24Hours,
      claimsLast7Days,
      uniqueIPCount: uniqueIPs.length,
      uniqueBrowserCount: uniqueBrowsers.length
    });
  } catch (error) {
    console.error('Get claim stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;