const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Set token as HTTP-only cookie with cross-domain support
    res.cookie('adminToken', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'none',
      secure: true,
      domain: process.env.COOKIE_DOMAIN || undefined
    });
    
    res.status(200).json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        username: admin.username
      },
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    domain: process.env.COOKIE_DOMAIN || undefined
  });
  res.status(200).json({ message: 'Logout successful' });
});

// Check admin authentication status
router.get('/check', authenticateAdmin, (req, res) => {
  res.status(200).json({ isAuthenticated: true });
});

// Create initial admin (for setup)
router.post('/setup', async (req, res) => {
  try {
    // Check if any admin already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    
    const { username, password } = req.body;
    
    // Create new admin
    const admin = new Admin({
      username,
      password
    });
    
    await admin.save();
    
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
