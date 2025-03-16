// const rateLimit = require('express-rate-limit');
// const UserClaim = require('../models/UserClaim');

// // Rate limiter for coupon claims - 1 claim per IP per hour
// const claimRateLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 1, // limit each IP to 1 request per windowMs
//   message: { message: 'Too many coupon claims from this IP, please try again after an hour' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // Custom middleware to check if user has already claimed a coupon
// const checkPreviousClaims = async (req, res, next) => {
//   try {
//     const { ipAddress, browserFingerprint } = req.userInfo;
    
//     // Check if this IP or browser has claimed a coupon in the last 24 hours
//     const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
//     const cutoffTime = new Date(Date.now() - cooldownPeriod);
    
//     const existingClaim = await UserClaim.findOne({
//       $or: [
//         { ipAddress, claimedAt: { $gte: cutoffTime } },
//         { browserFingerprint, claimedAt: { $gte: cutoffTime } }
//       ]
//     });
    
//     if (existingClaim) {
//       return res.status(429).json({ 
//         message: 'You have already claimed a coupon recently. Please try again later.',
//         nextAvailableTime: new Date(existingClaim.claimedAt.getTime() + cooldownPeriod)
//       });
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking previous claims:', error);
//     res.status(500).json({ message: 'Server error while checking claim eligibility' });
//   }
// };

// module.exports = {
//   claimRateLimiter,
//   checkPreviousClaims
// }; 



const rateLimit = require('express-rate-limit');
const UserClaim = require('../models/UserClaim');

// Rate limiter for coupon claims - basic protection against rapid requests
const claimRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 requests per minute
  message: { message: 'Too many requests, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom middleware to check if user has already claimed a coupon
const checkPreviousClaims = async (req, res, next) => {
  try {
    const { ipAddress, browserFingerprint } = req.userInfo;
    
    // Check if this browser fingerprint has claimed a coupon in the last 24 hours
    // Removed IP address check to allow multiple users on same network
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
