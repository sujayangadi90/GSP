const express = require('express');
const router = express.Router();
const {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');
const { protect } = require('../middleware/auth');

router.get('/', getBanners);
router.get('/all', protect, getAllBanners);
router.post('/', protect, createBanner);
router.put('/:id', protect, updateBanner);
router.delete('/:id', protect, deleteBanner);

module.exports = router;
