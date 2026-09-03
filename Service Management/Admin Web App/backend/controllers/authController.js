const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeygsp123', {
    expiresIn: '30d'
  });
};

// Ensure Software Owner User & System Config on Startup
const ensureSoftwareOwnerAndConfig = async () => {
  try {
    // 1. Ensure SystemConfig default
    const configExists = await SystemConfig.findOne({ key: 'adminAccessEnabled' });
    if (!configExists) {
      await SystemConfig.create({
        key: 'adminAccessEnabled',
        value: true,
        updatedBy: 'system'
      });
      console.log('Initialized SystemConfig: adminAccessEnabled = true');
    }

    // 2. Ensure Software Owner User sujay / 54321
    let owner = await User.findOne({
      $or: [
        { code: 'sujay' },
        { email: 'sujay@gsp.com' },
        { role: 'owner' }
      ]
    });

    if (!owner) {
      owner = await User.create({
        name: 'Sujay (Software Owner)',
        email: 'sujay@gsp.com',
        code: 'sujay',
        password: '54321', // Pre-save hook will hash this securely
        role: 'owner',
        status: 'active'
      });
      console.log('Seeded Software Owner account (sujay / 54321)');
    } else {
      // Ensure role & password match software owner requirement
      owner.role = 'owner';
      owner.code = 'sujay';
      owner.email = owner.email || 'sujay@gsp.com';
      owner.status = 'active';
      // Verify or update password if changed
      const isMatch = await owner.comparePassword('54321');
      if (!isMatch) {
        owner.password = '54321';
      }
      await owner.save();
    }
  } catch (error) {
    console.error('Error initializing Software Owner or SystemConfig:', error.message);
  }
};

// @desc    Auth user & get token (Unified login endpoint)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide credentials' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({
      $or: [
        { email: cleanUsername.toLowerCase() },
        { code: cleanUsername },
        { code: cleanUsername.toUpperCase() },
        { code: cleanUsername.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Software Owner Access Control check for Admin users
    if (user.role === 'admin') {
      const config = await SystemConfig.findOne({ key: 'adminAccessEnabled' });
      if (config && config.value === false) {
        return res.status(403).json({ message: 'Software Fee is pending. Kindly pay the fees to continue to use the software.' });
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      code: user.code,
      role: user.role,
      permissions: user.permissions || {
        dashboard: true,
        tickets: true,
        customers: true,
        manageDealers: true,
        manageTechnicians: true,
        followups: true,
        amcs: true,
        inventory: true,
        performance: true,
        reports: true,
        videoLibrary: true,
        settings: true
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system status (adminAccessEnabled)
// @route   GET /api/auth/system-status
// @access  Public / Authenticated
const getSystemStatus = async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ key: 'adminAccessEnabled' });
    res.json({
      adminAccessEnabled: config ? Boolean(config.value) : true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get access control status for software owner
// @route   GET /api/auth/access-control
// @access  Private / Owner
const getAccessControlStatus = async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ key: 'adminAccessEnabled' });
    res.json({
      adminAccessEnabled: config ? Boolean(config.value) : true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update access control status (ON/OFF) for software owner
// @route   PUT /api/auth/access-control
// @access  Private / Owner
const updateAccessControlStatus = async (req, res) => {
  const { adminAccessEnabled } = req.body;

  try {
    if (adminAccessEnabled === undefined) {
      return res.status(400).json({ message: 'adminAccessEnabled boolean state is required' });
    }

    const val = Boolean(adminAccessEnabled);
    const config = await SystemConfig.findOneAndUpdate(
      { key: 'adminAccessEnabled' },
      { value: val, updatedBy: req.user.email },
      { new: true, upsert: true }
    );

    res.json({
      adminAccessEnabled: Boolean(config.value),
      message: `Admin Panel Access successfully turned ${val ? 'ON' : 'OFF'}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register device FCM token for push notifications
// @route   POST /api/auth/fcm-token
// @access  Private
const registerFcmToken = async (req, res) => {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    await User.updateMany(
      { fcmTokens: token },
      { $pull: { fcmTokens: token } }
    );

    const user = await User.findById(req.user._id);
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ message: 'FCM token registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  getSystemStatus,
  getAccessControlStatus,
  updateAccessControlStatus,
  getUserProfile,
  registerFcmToken,
  ensureSoftwareOwnerAndConfig
};
