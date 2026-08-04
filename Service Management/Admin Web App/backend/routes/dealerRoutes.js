const express = require('express');
const { getDealers, addDealer, updateDealer, toggleDealerStatus } = require('../controllers/dealerController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin'), getDealers)
  .post(authorize('admin'), addDealer);

router.route('/:id')
  .put(authorize('admin'), updateDealer);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleDealerStatus);

module.exports = router;
