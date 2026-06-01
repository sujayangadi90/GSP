const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', loginAdmin);
router.get('/profile', protect, getAdminProfile);

module.exports = router;
