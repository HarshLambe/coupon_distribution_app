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
// This is now a placeholder that always allows the request to proceed
const checkPreviousClaims = async (req, res, next) => {
  // Simply proceed to the next middleware
  next();
};

module.exports = {
  claimRateLimiter,
  checkPreviousClaims
}; 
