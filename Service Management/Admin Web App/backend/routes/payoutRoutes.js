const express = require('express');
const router = express.Router();
const {
  calculateTechnicianPayout,
  createPayout,
  getPayouts
} = require('../controllers/payoutController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Route for technician or admin to fetch logged-in technician's payouts
router.get('/my-payouts', authorize('technician', 'admin'), (req, res) => {
  req.query.technicianId = req.user._id.toString();
  return getPayouts(req, res);
});

router.use(authorize('admin'));

router.get('/calculate', calculateTechnicianPayout);
router.route('/')
  .get(getPayouts)
  .post(createPayout);

module.exports = router;
