const jwt = require('jsonwebtoken');

// Middleware to verify admin JWT token
const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.adminToken || req.header('Authorization')?.replace('Bearer ', '');
  
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
  
  // Get browser fingerprint from cookie or generate a new one
  let browserFingerprint = req.cookies.browserFingerprint;
  
  if (!browserFingerprint) {
    // Generate a simple fingerprint (in a real app, use a more robust solution)
    browserFingerprint = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
    
    // Set cookie for 30 days
    res.cookie('browserFingerprint', browserFingerprint, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  
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