const express = require('express');
const router = express.Router();
const {
  calculateTechnicianPayout,
  createPayout,
  getPayouts
} = require('../controllers/payoutController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/calculate', calculateTechnicianPayout);
router.route('/')
  .get(getPayouts)
  .post(createPayout);

module.exports = router;
