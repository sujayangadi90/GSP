const express = require('express');
const router = express.Router();
const { submitInquiry, getInquiries, deleteInquiry, exportInquiries } = require('../controllers/inquiryController');
const { protect } = require('../middleware/auth');

router.post('/', submitInquiry);
router.get('/', protect, getInquiries);
router.get('/export', protect, exportInquiries);
router.delete('/:id', protect, deleteInquiry);

module.exports = router;
