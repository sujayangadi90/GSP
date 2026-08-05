const express = require('express');
const {
  getFollowUps,
  closeFollowUp
} = require('../controllers/followUpController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin'), getFollowUps);

router.route('/:id/close')
  .patch(authorize('admin'), closeFollowUp);

module.exports = router;
