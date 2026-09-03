const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeygsp123');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      if (req.user.status === 'inactive') {
        return res.status(403).json({ message: 'User account is deactivated' });
      }

      // Software Owner Access Control Enforcement for Admin Users
      if (req.user.role === 'admin') {
        const config = await SystemConfig.findOne({ key: 'adminAccessEnabled' });
        if (config && config.value === false) {
          return res.status(403).json({ message: 'Software Fee is pending. Kindly pay the fees to continue to use the software.' });
        }
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user ? req.user.role : 'none'}' is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
