const express = require('express');
const {
  getAppliances,
  createAppliance,
  updateAppliance,
  toggleAppliance,
  deleteAppliance
} = require('../controllers/applianceController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAppliances)
  .post(authorize('admin'), createAppliance);

router.route('/:id')
  .put(authorize('admin'), updateAppliance)
  .delete(authorize('admin'), deleteAppliance);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleAppliance);

module.exports = router;
