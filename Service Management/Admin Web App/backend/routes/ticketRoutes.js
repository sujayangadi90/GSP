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
  getDashboardStats,
  sendCustomAdminMessage
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.use(protect);

// Unified routes for query & create
router.route('/')
  .get(getTickets)
  .post(authorize('dealer', 'admin'), upload.single('invoiceImage'), createTicket);

router.route('/customers')
  .get(authorize('admin'), getCustomers);

router.route('/dashboard')
  .get(authorize('admin'), getDashboardStats);

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
