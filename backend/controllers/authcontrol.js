// authcontrol.js - Authentication controller for UnitedPulse backend

const User = require("../models/user");
const Admin = require("../models/Admin");
const Surveyor = require("../models/Surveyor");
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'unitedpulse_default_secret_change_in_production';
  return jwt.sign({ id }, secret, {
    expiresIn: '365d',
  });
};

const signupUser = async (req, res) => {
  try {
    const {
      name, email, password, role,
      dob, phone, address,
      organizationName, organizationContact, organizationEmail, organizationAddress,
      securityQuestion, securityAnswer
    } = req.body;

    // check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate passkey for admin role (no token on signup)
    let passkey = null;
    if (role === 'admin') {
      passkey = Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    // create user instance for pre-save hashing
    const user = new User({
      name,
      email,
      password,
      role,
      dob,
      phone,
      address,
      organizationName,
      organizationContact,
      organizationEmail,
      organizationAddress,
      securityQuestion,
      securityAnswer,
      passkey
    });
    await user.save();

    const response = {
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    // Return passkey for admin signup (token-free)
    if (role === 'admin') {
      response.passkey = passkey;
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, passkey } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // For admin role, verify passkey only if one is stored (backward compat)
    if (user.role === 'admin' && user.passkey) {
      if (!passkey) {
        return res.status(401).json({ message: 'Passkey required for admin login' });
      }
      if (user.passkey !== passkey) {
        return res.status(401).json({ message: 'Invalid passkey' });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin-specific signup (saves to unitedpulse.admins)
const signupAdmin = async (req, res) => {
  try {
    const {
      name, email, password,
      dob, phone, address,
      organizationName, organizationContact, organizationEmail, organizationAddress,
      securityQuestion, securityAnswer
    } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const passkey = Math.random().toString(36).substring(2, 10).toUpperCase();

    const admin = new Admin({
      name, email, password,
      dob, phone, address,
      organizationName, organizationContact, organizationEmail, organizationAddress,
      securityQuestion, securityAnswer,
      passkey
    });
    await admin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      passkey,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin-specific login (reads from unitedpulse.admins)
const loginAdmin = async (req, res) => {
  try {
    const { email, password, passkey } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (admin.passkey && admin.passkey !== passkey) {
      return res.status(401).json({ message: 'Invalid passkey' });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Surveyor-specific signup (saves to unitedpulse.surveyors)
const signupSurveyor = async (req, res) => {
  try {
    const {
      name, email, password,
      dob, phone, address,
      organizationName, organizationContact, organizationEmail, organizationAddress,
      securityQuestion, securityAnswer
    } = req.body;

    const exists = await Surveyor.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Surveyor already exists" });
    }

    const passkey = Math.random().toString(36).substring(2, 10).toUpperCase();

    const surveyor = new Surveyor({
      name, email, password,
      dob, phone, address,
      organizationName, organizationContact, organizationEmail, organizationAddress,
      securityQuestion, securityAnswer,
      passkey
    });
    await surveyor.save();

    res.status(201).json({
      message: "Surveyor registered successfully",
      passkey,
      surveyor: {
        _id: surveyor._id,
        name: surveyor.name,
        email: surveyor.email,
        role: surveyor.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Surveyor-specific login (reads from unitedpulse.surveyors)
const loginSurveyor = async (req, res) => {
  try {
    const { email, password, passkey, securityQuestion, securityAnswer } = req.body;

    console.log('[DEBUG loginSurveyor] req.body:', { email, password: '***', passkey, securityQuestion, securityAnswer });

    const surveyor = await Surveyor.findOne({ email });

    if (!surveyor) {
      console.log('[DEBUG loginSurveyor] surveyor not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('[DEBUG loginSurveyor] surveyor found:', { name: surveyor.name, hasPasskey: !!surveyor.passkey, hasSecurityQ: !!surveyor.securityQuestion });

    const passwordMatch = await surveyor.matchPassword(password);
    if (!passwordMatch) {
      console.log('[DEBUG loginSurveyor] password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate passkey only if user provided one and account has one stored
    if (passkey && surveyor.passkey && surveyor.passkey !== passkey) {
      console.log('[DEBUG loginSurveyor] passkey mismatch');
      return res.status(401).json({ message: 'Invalid passkey' });
    }

    // Validate security question/answer only if user provided them AND account has them stored
    if (securityQuestion && securityAnswer && surveyor.securityQuestion) {
      if (
        surveyor.securityQuestion !== securityQuestion ||
        surveyor.securityAnswer !== securityAnswer
      ) {
        console.log('[DEBUG loginSurveyor] security Q/A mismatch');
        return res.status(401).json({ message: 'Invalid security question or answer' });
      }
    }

    console.log('[DEBUG loginSurveyor] login successful');
    res.json({
      _id: surveyor._id,
      name: surveyor.name,
      email: surveyor.email,
      phone: surveyor.phone,
      organizationName: surveyor.organizationName,
      role: surveyor.role,
      token: generateToken(surveyor._id),
    });
  } catch (error) {
    console.log('[DEBUG loginSurveyor] error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile (protected route)
const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signupUser, loginUser, signupAdmin, loginAdmin, signupSurveyor, loginSurveyor, getMe };
