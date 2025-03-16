const jwt = require('jsonwebtoken');

// Middleware to verify admin JWT token
const authenticateAdmin = (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
  let token = req.cookies.adminToken;
  
  // If not in cookies, check Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to capture user IP and browser fingerprint
const captureUserInfo = (req, res, next) => {
  // Get IP address
  const ipAddress = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress || 
                    req.connection.socket.remoteAddress;
  
  // Always generate a new fingerprint for each request
  // This will allow each device to claim one coupon regardless of previous claims
  const timestamp = Date.now();
  const randomValue = Math.random().toString(36).substring(2, 15);
  const browserFingerprint = `${timestamp}-${randomValue}`;
  
  // Attach user info to request object
  req.userInfo = {
    ipAddress,
    browserFingerprint
  };
  
  next();
};

module.exports = {
  authenticateAdmin,
  captureUserInfo
}; 
