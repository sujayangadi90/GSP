const express = require('express');
const {
  createItem,
  getItems,
  updateItem,
  stockIn,
  stockOut
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(getItems)
  .post(authorize('admin'), createItem);

router.route('/:id')
  .put(authorize('admin'), updateItem);

router.route('/:id/stock-in')
  .post(authorize('admin'), stockIn);

router.route('/:id/stock-out')
  .post(authorize('admin'), stockOut);

module.exports = router;
