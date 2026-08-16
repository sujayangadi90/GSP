const express = require('express');
const { loginUser, getUserProfile, registerFcmToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/fcm-token', protect, registerFcmToken);

module.exports = router;
