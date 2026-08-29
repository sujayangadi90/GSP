const express = require('express');
const {
  getVideoLibraryItems,
  createVideoLibraryItem,
  updateVideoLibraryItem,
  deleteVideoLibraryItem
} = require('../controllers/videoLibraryController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(getVideoLibraryItems)
  .post(authorize('admin'), createVideoLibraryItem);

router.route('/:id')
  .put(authorize('admin'), updateVideoLibraryItem)
  .delete(authorize('admin'), deleteVideoLibraryItem);

module.exports = router;
