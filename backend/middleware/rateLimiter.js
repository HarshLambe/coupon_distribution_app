const rateLimit = require('express-rate-limit');
const UserClaim = require('../models/UserClaim');

// Rate limiter for coupon claims - basic protection against rapid requests
const claimRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  message: { message: 'Too many requests, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + partial user agent as key to better distinguish between devices
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const userAgentKey = userAgent.substring(0, 20); // Just use part of the user agent
    return `${ip}-${userAgentKey}`;
  }
});

// Custom middleware to check if user has already claimed a coupon
const checkPreviousClaims = async (req, res, next) => {
  try {
    const { browserFingerprint } = req.userInfo;
    
    // Check if this browser fingerprint has claimed a coupon in the last 24 hours
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const cutoffTime = new Date(Date.now() - cooldownPeriod);
    
    const existingClaim = await UserClaim.findOne({
      browserFingerprint, 
      claimedAt: { $gte: cutoffTime }
    });
    
    if (existingClaim) {
      return res.status(429).json({ 
        message: 'You have already claimed a coupon with this device. Please try with a different device or wait 24 hours.',
        nextAvailableTime: new Date(existingClaim.claimedAt.getTime() + cooldownPeriod)
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking previous claims:', error);
    res.status(500).json({ message: 'Server error while checking claim eligibility' });
  }
};

module.exports = {
  claimRateLimiter,
  checkPreviousClaims
}; 
