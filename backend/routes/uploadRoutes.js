const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded or file type is not supported.' });
  }
  // Return the web-accessible path
  res.json({
    message: 'Image uploaded successfully',
    path: `/uploads/${req.file.filename}`
  });
});

module.exports = router;
