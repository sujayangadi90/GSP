const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeygsp123', {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token (Unified login endpoint)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body; // username can be email or dealer/technician code

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide credentials' });
    }

    // Check if the username looks like an email or a code
    let user;
    if (username.includes('@')) {
      user = await User.findOne({ email: username.trim().toLowerCase() });
    } else {
      user = await User.findOne({ code: username.trim().toUpperCase() });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated' });
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
        settings: true
      },
      token: generateToken(user._id)
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

    // Pull this token from any other users to prevent multiple delivery of same message to one token
    await User.updateMany(
      { fcmTokens: token },
      { $pull: { fcmTokens: token } }
    );

    // Push token to current logged-in user if it doesn't already exist
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

module.exports = { loginUser, getUserProfile, registerFcmToken };
