const express = require('express');
const { 
  getDealers, 
  addDealer, 
  updateDealer, 
  toggleDealerStatus,
  getDealerVideos,
  uploadDealerVideo,
  deleteDealerVideo
} = require('../controllers/dealerController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.use(protect);

// Video Upload Route (stores file into /uploads)
router.route('/upload-video')
  .post(authorize('admin'), upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a video file' });
    }
    res.status(200).json({ filePath: 'uploads/' + req.file.filename });
  });

router.route('/')
  .get(authorize('admin'), getDealers)
  .post(authorize('admin'), addDealer);

router.route('/:id/videos')
  .get(getDealerVideos)
  .post(authorize('admin'), uploadDealerVideo);

router.route('/videos/:videoId')
  .delete(authorize('admin'), deleteDealerVideo);

router.route('/:id')
  .put(authorize('admin'), updateDealer);

router.route('/:id/toggle')
  .patch(authorize('admin'), toggleDealerStatus);

module.exports = router;
