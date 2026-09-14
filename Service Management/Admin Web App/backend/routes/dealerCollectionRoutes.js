const express = require('express');
const router = express.Router();
const {
  createDealerCollection,
  getDealerCollections,
  getDealerWallet,
  getDealerWalletTransactions,
  syncDealerWallets
} = require('../controllers/dealerCollectionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/sync-wallets', authorize('admin'), syncDealerWallets);
router.get('/transactions', authorize('admin', 'dealer'), getDealerWalletTransactions);
router.get('/dealer/:id/wallet', authorize('admin', 'dealer'), getDealerWallet);

router.route('/')
  .get(authorize('admin', 'dealer'), getDealerCollections)
  .post(authorize('admin'), createDealerCollection);

module.exports = router;
