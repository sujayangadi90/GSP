const express = require('express');
const router = express.Router();
const { getCmsContent, updateCmsContent } = require('../controllers/cmsController');
const { protect } = require('../middleware/auth');

router.get('/', getCmsContent);
router.post('/:key', protect, updateCmsContent);

module.exports = router;
