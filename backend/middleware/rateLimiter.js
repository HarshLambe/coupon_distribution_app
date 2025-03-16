const rateLimit = require('express-rate-limit');
const UserClaim = require('../models/UserClaim');

// Rate limiter for coupon claims - basic protection against rapid requests
const claimRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 requests per 5 minutes
  message: { message: 'Too many requests, please try again after a few minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// Custom middleware to check if user has already claimed a coupon
const checkPreviousClaims = async (req, res, next) => {
  try {
    // Check if this browser fingerprint has already claimed a coupon
    const existingClaim = await UserClaim.findOne({
      browserFingerprint: req.userInfo.browserFingerprint
    });
    
    if (existingClaim) {
      return res.status(403).json({ 
        message: 'You have already claimed a coupon. Each device can only claim one coupon.',
        alreadyClaimed: true,
        claimedAt: existingClaim.claimedAt
      });
    }
    
    // If no previous claim, proceed to the next middleware
    next();
  } catch (error) {
    console.error('Error checking previous claims:', error);
    // In case of error, allow the request to proceed
    next();
  }
};

module.exports = {
  claimRateLimiter,
  checkPreviousClaims
}; 
