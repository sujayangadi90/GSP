const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Create a new request (Installation or Service)
// @route   POST /api/tickets
// @access  Private/Dealer
const createTicket = async (req, res) => {
  const {
    type,
    customer,
    product,
    serviceDetails,
    installationDetails,
    preferredVisitDate,
    remarks
  } = req.body;

  try {
    const ticket = new Ticket({
      type,
      customer,
      product,
      serviceDetails,
      installationDetails,
      preferredVisitDate,
      remarks,
      dealer: req.user._id,
      status: 'new'
    });

    if (req.file) {
      ticket.invoiceImage = 'uploads/' + req.file.filename;
    }

    const createdTicket = await ticket.save();
    res.status(201).json(createdTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tickets with filters
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const { status, type, dealer, technician, city, search } = req.query;
    let query = {};

    // For dealers, restrict to their own tickets
    if (req.user.role === 'dealer') {
      query.dealer = req.user._id;
    }
    // For technicians, restrict to their assigned tickets
    else if (req.user.role === 'technician') {
      query.assignedTechnician = req.user._id;
    }

    // Applying filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (dealer && req.user.role === 'admin') query.dealer = dealer;
    if (technician && req.user.role === 'admin') query.assignedTechnician = technician;
    if (city) query['customer.city'] = { $regex: city, $options: 'i' };

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.mobile': { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('dealer', 'name code email mobile')
      .populate('assignedTechnician', 'name code mobile')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single ticket details
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('dealer', 'name code email mobile contactPerson address city')
      .populate('assignedTechnician', 'name code mobile email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Authorization checks
    if (req.user.role === 'dealer' && ticket.dealer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    if (req.user.role === 'technician' && (!ticket.assignedTechnician || ticket.assignedTechnician._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign or reassign a technician
// @route   PATCH /api/tickets/:id/assign
// @access  Private/Admin
const assignTechnician = async (req, res) => {
  const { technicianId, assignmentNotes } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({ message: 'Invalid technician' });
    }

    ticket.assignedTechnician = technicianId;
    ticket.assignmentNotes = assignmentNotes;
    ticket.status = 'assigned';

    ticket.timeline.push({
      status: 'assigned',
      note: `Assigned to technician ${technician.name}. Note: ${assignmentNotes || 'None'}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Technician updates status
// @route   PATCH /api/tickets/:id/status
// @access  Private/Technician
const updateTicketStatus = async (req, res) => {
  const { status, note } = req.body; // status should be 'in_progress', etc.

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.assignedTechnician.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    ticket.status = status;
    ticket.timeline.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Technician submits work completion
// @route   PATCH /api/tickets/:id/complete
// @access  Private/Technician
const submitWorkCompletion = async (req, res) => {
  const { workDone, remarks } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.assignedTechnician.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this ticket' });
    }

    const completionPhotos = [];
    if (req.files) {
      req.files.forEach(file => {
        completionPhotos.push('uploads/' + file.filename);
      });
    }

    ticket.status = 'verification_pending';
    ticket.completion = {
      photos: completionPhotos,
      workDone,
      remarks,
      submittedAt: Date.now()
    };

    ticket.timeline.push({
      status: 'verification_pending',
      note: `Work marked completed by technician. Remarks: ${remarks || 'None'}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin verifies completed work (approve/reject)
// @route   PATCH /api/tickets/:id/verify
// @access  Private/Admin
const verifyWork = async (req, res) => {
  const { approvalStatus, reason } = req.body; // approvalStatus: 'approved' or 'rejected'

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status !== 'verification_pending') {
      return res.status(400).json({ message: 'Ticket is not pending verification' });
    }

    if (approvalStatus === 'approved') {
      ticket.status = 'completed'; // or directly 'closed'
      ticket.adminVerification = {
        status: 'approved',
        reason,
        verifiedAt: Date.now()
      };
      ticket.timeline.push({
        status: 'completed',
        note: `Work approved by Admin. ${reason ? `Note: ${reason}` : ''}`,
        updatedBy: req.user.name
      });
    } else {
      ticket.status = 'assigned'; // Reject sends it back to technician
      ticket.adminVerification = {
        status: 'rejected',
        reason,
        verifiedAt: Date.now()
      };
      ticket.timeline.push({
        status: 'assigned',
        note: `Work rejected by Admin. Reason: ${reason || 'No reason provided'}`,
        updatedBy: req.user.name
      });
    }

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin closes ticket
// @route   PATCH /api/tickets/:id/close
// @access  Private/Admin
const closeTicket = async (req, res) => {
  const { closingRemarks } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'closed';
    ticket.closingRemarks = closingRemarks;
    ticket.closedAt = Date.now();

    ticket.timeline.push({
      status: 'closed',
      note: `Ticket closed. Remarks: ${closingRemarks || 'None'}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  assignTechnician,
  updateTicketStatus,
  submitWorkCompletion,
  verifyWork,
  closeTicket
};
