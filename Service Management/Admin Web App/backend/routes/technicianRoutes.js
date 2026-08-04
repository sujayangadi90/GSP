const express = require('express');
const { getTechnicians, addTechnician, updateTechnician, toggleTechnicianStatus } = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin'), getTechnicians)
  .post(authorize('admin'), addTechnician);

router.route('/:id')
  .put(authorize('admin'), updateTechnician);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleTechnicianStatus);

module.exports = router;
