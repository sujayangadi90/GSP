const express = require('express');
const {
  createAmc,
  getAmcs,
  getAmcById,
  updateAmc,
  cancelAmc
} = require('../controllers/amcController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getAmcs)
  .post(createAmc);

router.route('/:id')
  .get(getAmcById)
  .put(updateAmc);

router.route('/:id/cancel')
  .patch(cancelAmc);

module.exports = router;
