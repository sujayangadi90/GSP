const express = require('express');
const router = express.Router();
const {
  getGalleryImages,
  getAllGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');

router.get('/', getGalleryImages);
router.get('/all', protect, getAllGalleryImages);
router.post('/', protect, createGalleryImage);
router.put('/:id', protect, updateGalleryImage);
router.delete('/:id', protect, deleteGalleryImage);

module.exports = router;
