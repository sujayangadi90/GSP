const express = require('express');
const router = express.Router();
const {
  getAwards,
  getAllAwards,
  createAward,
  updateAward,
  deleteAward
} = require('../controllers/awardController');
const { protect } = require('../middleware/auth');

router.get('/', getAwards);
router.get('/all', protect, getAllAwards);
router.post('/', protect, createAward);
router.put('/:id', protect, updateAward);
router.delete('/:id', protect, deleteAward);

module.exports = router;
