const express = require('express');
const {
  getFollowUps,
  createFollowUp,
  addFollowUpNote,
  closeFollowUp
} = require('../controllers/followUpController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin'), getFollowUps)
  .post(authorize('admin'), createFollowUp);

router.route('/:id/close')
  .patch(authorize('admin'), closeFollowUp);

router.route('/:id/notes')
  .post(authorize('admin'), addFollowUpNote);

module.exports = router;
