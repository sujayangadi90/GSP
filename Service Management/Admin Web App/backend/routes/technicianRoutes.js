const express = require('express');
const { getTechnicians, addTechnician, getTechnicianById, updateTechnician, toggleTechnicianStatus, triggerDailyAssignedNotifications, getTechnicianWallet, getTechnicianWalletSelf } = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.use(protect);

router.route('/me/wallet')
  .get(getTechnicianWalletSelf);

router.route('/trigger-daily-assigned-notifications')
  .post(authorize('admin'), triggerDailyAssignedNotifications);

router.route('/upload')
  .post(authorize('admin'), upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    res.status(200).json({ filePath: 'uploads/' + req.file.filename });
  });

router.route('/')
  .get(authorize('admin'), getTechnicians)
  .post(authorize('admin'), addTechnician);

router.route('/:id/wallet')
  .get(authorize('admin'), getTechnicianWallet);

router.route('/:id')
  .get(authorize('admin'), getTechnicianById)
  .put(authorize('admin'), updateTechnician);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleTechnicianStatus);

module.exports = router;
