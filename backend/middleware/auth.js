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
  
  // Get browser fingerprint from cookie or generate a new one
  let browserFingerprint = req.cookies.browserFingerprint;
  
  if (!browserFingerprint) {
    // Generate a unique fingerprint for this device
    const userAgent = req.headers['user-agent'] || '';
    const randomValue = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    browserFingerprint = Buffer.from(`${userAgent}-${randomValue}-${timestamp}`).toString('base64');
    
    // Set cookie for 30 days
    res.cookie('browserFingerprint', browserFingerprint, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/'
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
