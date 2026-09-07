const express = require('express');
const router = express.Router();
const {
  calculateDealerCollection,
  createDealerCollection,
  getDealerCollections
} = require('../controllers/dealerCollectionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/calculate', authorize('admin'), calculateDealerCollection);
router.route('/')
  .get(authorize('admin', 'dealer'), getDealerCollections)
  .post(authorize('admin'), createDealerCollection);

module.exports = router;
