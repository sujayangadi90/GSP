const express = require('express');
const {
  createTicket,
  getTickets,
  getTicketById,
  assignTechnician,
  updateTicketStatus,
  submitWorkCompletion,
  verifyWork,
  closeTicket,
  cancelTicket,
  getCustomers,
  addCustomer,
  updateCustomer,
  getDashboardStats,
  sendCustomAdminMessage,
  getReports
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.use(protect);

router.route('/reports')
  .get(authorize('admin'), getReports);

// Unified routes for query & create
router.route('/')
  .get(getTickets)
  .post(authorize('dealer', 'admin'), upload.single('invoiceImage'), createTicket);

router.route('/customers')
  .get(authorize('admin'), getCustomers)
  .post(authorize('admin'), addCustomer);

router.route('/customers/:id')
  .put(authorize('admin'), updateCustomer);

router.route('/dashboard')
  .get(authorize('admin'), getDashboardStats);

router.route('/upload')
  .post(upload.single('invoiceImage'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    res.status(200).json({ filePath: 'uploads/' + req.file.filename });
  });

// Single ticket detail
router.route('/:id')
  .get(getTicketById);

// Admin-only assignment, verification, closure, messages
router.route('/:id/assign').patch(authorize('admin'), assignTechnician);
router.route('/:id/verify').patch(authorize('admin'), verifyWork);
router.route('/:id/close').patch(authorize('admin'), closeTicket);
router.route('/:id/cancel').patch(authorize('admin'), cancelTicket);
router.route('/:id/message').post(authorize('admin'), sendCustomAdminMessage);

// Technician-only updates
router.route('/:id/status').patch(authorize('technician'), updateTicketStatus);
router.route('/:id/complete').patch(authorize('technician'), upload.array('photos', 5), submitWorkCompletion);

module.exports = router;
