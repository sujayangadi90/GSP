const express = require('express');
const {
  getBrands,
  createBrand,
  updateBrand,
  toggleBrand,
  deleteBrand
} = require('../controllers/brandController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBrands)
  .post(authorize('admin'), createBrand);

router.route('/:id')
  .put(authorize('admin'), updateBrand)
  .delete(authorize('admin'), deleteBrand);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleBrand);

module.exports = router;
