const express = require('express');
const { getAdmins, addAdmin, updateAdmin, toggleAdminStatus, getMemoryUsage } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/memory-usage', authorize('admin'), getMemoryUsage);

router.route('/')
  .get(authorize('admin'), getAdmins)
  .post(authorize('admin'), addAdmin);

router.route('/:id')
  .put(authorize('admin'), updateAdmin);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleAdminStatus);

module.exports = router;

