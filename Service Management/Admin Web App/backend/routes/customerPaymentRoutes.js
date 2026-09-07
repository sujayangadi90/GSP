const express = require('express');
const router = express.Router();
const { getCustomerPayments } = require('../controllers/customerPaymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getCustomerPayments);

module.exports = router;
