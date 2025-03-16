const mongoose = require('mongoose');

const userClaimSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true
  },
  browserFingerprint: {
    type: String,
    required: true
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  claimedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on ipAddress and browserFingerprint
userClaimSchema.index({ ipAddress: 1, browserFingerprint: 1 });

module.exports = mongoose.model('UserClaim', userClaimSchema); 