const express = require('express');
const router = express.Router();
const {
  calculateTechnicianPayout,
  createPayout,
  getPayouts
} = require('../controllers/payoutController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/calculate', calculateTechnicianPayout);
router.route('/')
  .get(getPayouts)
  .post(createPayout);

module.exports = router;
