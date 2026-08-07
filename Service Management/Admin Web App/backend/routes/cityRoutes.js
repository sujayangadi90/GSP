const express = require('express');
const {
  getCities,
  createCity,
  updateCity,
  toggleCity,
  deleteCity
} = require('../controllers/cityController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCities)
  .post(authorize('admin'), createCity);

router.route('/:id')
  .put(authorize('admin'), updateCity)
  .delete(authorize('admin'), deleteCity);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleCity);

module.exports = router;
