const express = require('express');
const router = express.Router();
const {
  calculateDealerCollection,
  createDealerCollection,
  getDealerCollections
} = require('../controllers/dealerCollectionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/calculate', calculateDealerCollection);
router.route('/')
  .get(getDealerCollections)
  .post(createDealerCollection);

module.exports = router;
