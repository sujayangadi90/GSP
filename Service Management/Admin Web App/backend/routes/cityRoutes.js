const express = require('express');
const {
  getCities,
  createCity,
  updateCity,
  toggleCity,
  deleteCity,
  addTaluk,
  updateTaluk,
  toggleTaluk,
  deleteTaluk
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

router.route('/:id/taluks')
  .post(authorize('admin'), addTaluk);

router.route('/:id/taluks/:talukId')
  .put(authorize('admin'), updateTaluk)
  .delete(authorize('admin'), deleteTaluk);

router.route('/:id/taluks/:talukId/toggle')
  .patch(authorize('admin'), toggleTaluk);

module.exports = router;
