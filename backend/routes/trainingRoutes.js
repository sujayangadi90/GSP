const express = require('express');
const router = express.Router();
const { submitLead, getLeads } = require('../controllers/trainingController');
const { protect } = require('../middleware/auth');

router.post('/leads', submitLead);
router.get('/leads', protect, getLeads);

module.exports = router;
