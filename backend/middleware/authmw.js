const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Admin = require('../models/Admin');
const Surveyor = require('../models/Surveyor');

const JWT_SECRET = process.env.JWT_SECRET || 'unitedpulse_default_secret_change_in_production';

const protect = async (req, res, next) => {
  let token;
  console.log("HEADERS:", req.headers.authorization);// Debugging log to check if authorization header is being received

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
   console.log("TOKEN:", token);// Debugging log to check if token is being received

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("DECODED:", decoded); // Debugging log to check the decoded token payload

    // Try all user models
    let user = await User.findById(decoded.id).select('-password');
    if (!user) user = await Admin.findById(decoded.id).select('-password');
    if (!user) user = await Surveyor.findById(decoded.id).select('-password');
        console.log("USER FOUND:", user);// Debugging log to check if user is found in any of the models

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("❌ TOKEN ERROR:", error.message); // Debugging log to check the error message when token verification fails
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
