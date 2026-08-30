const express = require('express');
const {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  finalizeEvaluation,
  unlockEvaluation,
  deleteEvaluation,
  getTechnicianPerformanceProfile
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// Performance Areas
router.route('/areas')
  .get(getAreas)
  .post(authorize('admin'), createArea);

router.route('/areas/:id')
  .put(authorize('admin'), updateArea)
  .delete(authorize('admin'), deleteArea);

// Technician Profile Summary & Trend
router.route('/technician/:techId/summary')
  .get(getTechnicianPerformanceProfile);

// Evaluations
router.route('/evaluations')
  .get(getEvaluations)
  .post(authorize('admin'), createEvaluation);

router.route('/evaluations/:id')
  .get(getEvaluationById)
  .put(authorize('admin'), updateEvaluation)
  .delete(authorize('admin'), deleteEvaluation);

router.route('/evaluations/:id/finalize')
  .patch(authorize('admin'), finalizeEvaluation);

router.route('/evaluations/:id/unlock')
  .patch(authorize('admin'), unlockEvaluation);

module.exports = router;
