const express = require('express');
const {
  loginUser,
  getSystemStatus,
  getAccessControlStatus,
  updateAccessControlStatus,
  getUserProfile,
  registerFcmToken
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/login', loginUser);
router.get('/system-status', getSystemStatus);

router.get('/access-control', protect, authorize('owner'), getAccessControlStatus);
router.put('/access-control', protect, authorize('owner'), updateAccessControlStatus);

router.get('/profile', protect, getUserProfile);
router.post('/fcm-token', protect, registerFcmToken);

module.exports = router;
