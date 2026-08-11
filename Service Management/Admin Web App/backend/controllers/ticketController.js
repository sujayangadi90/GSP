const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Appliance = require('../models/Appliance');
const Brand = require('../models/Brand');
const FollowUp = require('../models/FollowUp');

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
    remarks,
    dealer
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
      dealer: req.user.role === 'admin' ? dealer : req.user._id,
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
    const { status, type, dealer, technician, city, search, customerMobile, fromDate, toDate, performanceFilter, month, year, page, limit, dashboardFilter } = req.query;
    let query = {};

    // For dealers, restrict to their own tickets
    if (req.user.role === 'dealer') {
      query.dealer = req.user._id;
    }
    // For technicians, restrict to their assigned tickets
    else if (req.user.role === 'technician') {
      query.assignedTechnician = req.user._id;
    }

    // Dashboard specific filters for admin
    if (dashboardFilter === 'true' && req.user.role === 'admin' && fromDate && toDate) {
      const start = new Date(`${fromDate}T00:00:00`);
      const end = new Date(`${toDate}T23:59:59.999`);

      if (status === 'new') {
        query.status = 'new';
        query.createdAt = { $gte: start, $lte: end };
      } else if (status === 'assigned') {
        query.status = { $ne: 'new' };
        query.timeline = {
          $elemMatch: {
            status: 'assigned',
            timestamp: { $gte: start, $lte: end }
          }
        };
      } else if (status === 'closed') {
        query.status = 'closed';
        query.closedAt = { $gte: start, $lte: end };
      } else if (status === 'pending') {
        query.status = { $in: ['in_progress', 'verification_pending', 'completed'] };
      } else {
        // total/all
        query.createdAt = { $gte: start, $lte: end };
      }

      if (city) query['customer.city'] = { $regex: city, $options: 'i' };
      if (type) query.type = type;
      if (search) {
        query.$or = [
          { ticketNumber: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.mobile': { $regex: search, $options: 'i' } },
          { 'product.name': { $regex: search, $options: 'i' } }
        ];
      }

      if (status === 'pending') {
        let tickets = await Ticket.find(query)
          .populate('dealer', 'name code email mobile')
          .populate('assignedTechnician', 'name code mobile')
          .sort({ createdAt: -1 });

        // filter in memory
        tickets = tickets.filter(ticket => {
          const currentStatusTimeline = [...ticket.timeline]
            .reverse()
            .find(item => item.status === ticket.status);
          if (currentStatusTimeline) {
            const ts = new Date(currentStatusTimeline.timestamp);
            return ts >= start && ts <= end;
          }
          return ticket.updatedAt >= start && ticket.updatedAt <= end;
        });

        return res.json(tickets);
      }
    } else if (status) {
      if (req.user.role === 'dealer') {
        if (status === 'all') {
          // fetch all
        } else if (status === 'open') {
          query.status = { $in: ['new', 'assigned', 'in_progress'] };
        } else if (status === 'completed') {
          query.status = { $in: ['completed', 'verification_pending'] };
        } else {
          query.status = status;
        }
      } else if (req.user.role === 'technician') {
        if (status === 'assigned') {
          query.status = { $in: ['assigned', 'in_progress'] };
        } else if (status === 'closed') {
          query.status = { $in: ['completed', 'verification_pending', 'closed'] };
        } else {
          query.status = status;
        }
      } else {
        query.status = status;
      }
    }
    if (type) query.type = type;
    if (customerMobile) query['customer.mobile'] = customerMobile;
    if (dealer && req.user.role === 'admin') {
      query.dealer = dealer;

      if (req.query.dealerFilter) {
        const start = new Date(`${fromDate}T00:00:00`);
        const end = new Date(`${toDate}T23:59:59.999`);
        query.createdAt = { $gte: start, $lte: end };

        const tickets = await Ticket.find(query)
          .populate('dealer', 'name code email mobile')
          .populate('assignedTechnician', 'name code mobile')
          .sort({ createdAt: -1 });

        const totalCount = await Ticket.countDocuments({
          dealer,
          createdAt: { $gte: start, $lte: end }
        });

        const completedCount = await Ticket.countDocuments({
          dealer,
          status: { $in: ['completed', 'closed'] },
          createdAt: { $gte: start, $lte: end }
        });

        const inProgressCount = await Ticket.countDocuments({
          dealer,
          status: { $in: ['assigned', 'in_progress'] },
          createdAt: { $gte: start, $lte: end }
        });

        const pendingVerificationCount = await Ticket.countDocuments({
          dealer,
          status: 'verification_pending',
          createdAt: { $gte: start, $lte: end }
        });

        return res.json({
          tickets,
          summary: {
            total: totalCount,
            completed: completedCount,
            inProgress: inProgressCount,
            pendingVerification: pendingVerificationCount
          }
        });
      }
    }
    
    if (technician && req.user.role === 'admin') {
      query.assignedTechnician = technician;

      if (performanceFilter) {
        const start = new Date(`${fromDate}T00:00:00`);
        const end = new Date(`${toDate}T23:59:59.999`);

        if (performanceFilter === 'assigned') {
          query.timeline = { $elemMatch: { status: 'assigned', timestamp: { $gte: start, $lte: end } } };
        } else if (performanceFilter === 'completed') {
          query.status = { $in: ['completed', 'closed'] };
          query['completion.submittedAt'] = { $gte: start, $lte: end };
        } else {
          // assigned_completed
          query.$or = [
            { timeline: { $elemMatch: { status: 'assigned', timestamp: { $gte: start, $lte: end } } } },
            { status: { $in: ['completed', 'closed'] }, 'completion.submittedAt': { $gte: start, $lte: end } }
          ];
        }

        const tickets = await Ticket.find(query)
          .populate('dealer', 'name code email mobile')
          .populate('assignedTechnician', 'name code mobile')
          .sort({ createdAt: -1 });

        const totalCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          timeline: { $elemMatch: { status: 'assigned', timestamp: { $gte: start, $lte: end } } }
        });

        const completedCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          status: { $in: ['completed', 'closed'] },
          'completion.submittedAt': { $gte: start, $lte: end }
        });

        const inProgressCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          status: { $in: ['assigned', 'in_progress'] },
          timeline: { $elemMatch: { status: 'assigned', timestamp: { $gte: start, $lte: end } } }
        });

        const pendingVerificationCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          status: 'verification_pending',
          'completion.submittedAt': { $gte: start, $lte: end }
        });

        return res.json({
          tickets,
          summary: {
            total: totalCount,
            completed: completedCount,
            inProgress: inProgressCount,
            pendingVerification: pendingVerificationCount
          }
        });
      }
    }

    if (city) query['customer.city'] = { $regex: city, $options: 'i' };

    if (fromDate && toDate && !performanceFilter && dashboardFilter !== 'true') {
      const start = new Date(fromDate);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setUTCHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.mobile': { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    if (page) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 10;
      const skip = (p - 1) * l;

      const total = await Ticket.countDocuments(query);
      const tickets = await Ticket.find(query)
        .populate('dealer', 'name code email mobile')
        .populate('assignedTechnician', 'name code mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l);

      return res.json({
        data: tickets,
        page: p,
        limit: l,
        hasMore: (skip + tickets.length) < total
      });
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

    if (!ticket.assignedTechnician || ticket.assignedTechnician.toString() !== req.user._id.toString()) {
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

    if (!ticket.assignedTechnician || ticket.assignedTechnician.toString() !== req.user._id.toString()) {
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

    // Auto-generate follow-up record
    try {
      const applianceName = ticket.product.category || '';
      const brandName = ticket.product.name || '';

      const appliance = await Appliance.findOne({ name: { $regex: new RegExp(`^${applianceName.trim()}$`, 'i') } });
      let followUpDays = 90; // Default if not found

      if (appliance) {
        const brand = await Brand.findOne({
          appliance: appliance._id,
          name: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') }
        });
        if (brand) {
          followUpDays = brand.followUpDays;
        }
      }

      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + followUpDays);

      await FollowUp.create({
        ticket: ticket._id,
        dueAt,
        status: 'new'
      });
    } catch (followUpError) {
      console.error('Failed to auto-create follow-up:', followUpError.message);
    }

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all unique customers
// @route   GET /api/tickets/customers
// @access  Private/Admin
const getCustomers = async (req, res) => {
  try {
    const customers = await Ticket.aggregate([
      {
        $group: {
          _id: "$customer.mobile",
          name: { $first: "$customer.name" },
          mobile: { $first: "$customer.mobile" },
          alternateMobile: { $first: "$customer.alternateMobile" },
          address: { $first: "$customer.address" },
          city: { $first: "$customer.city" },
          pincode: { $first: "$customer.pincode" },
          lastTicketDate: { $max: "$createdAt" },
          ticketCount: { $sum: 1 }
        }
      },
      { $sort: { name: 1 } }
    ]);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard statistics with date filters
// @route   GET /api/tickets/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'fromDate and toDate are required' });
    }

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59.999`);

    // Total Requests: tickets created within [start, end]
    const totalCount = await Ticket.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // New Requests: tickets created within [start, end] with status 'new'
    const newCount = await Ticket.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'new'
    });

    // Assigned Requests: assignment date within [start, end] and status !== 'new'
    const assignedCount = await Ticket.countDocuments({
      status: { $ne: 'new' },
      timeline: {
        $elemMatch: {
          status: 'assigned',
          timestamp: { $gte: start, $lte: end }
        }
      }
    });

    // Pending/Action Requests: in_progress, verification_pending, or completed
    // whose status entry timestamp (or updatedAt fallback) is in the date range
    const pendingTickets = await Ticket.find({
      status: { $in: ['in_progress', 'verification_pending', 'completed'] }
    });
    const pendingCount = pendingTickets.filter(ticket => {
      const currentStatusTimeline = [...ticket.timeline]
        .reverse()
        .find(item => item.status === ticket.status);
      if (currentStatusTimeline) {
        const ts = new Date(currentStatusTimeline.timestamp);
        return ts >= start && ts <= end;
      }
      return ticket.updatedAt >= start && ticket.updatedAt <= end;
    }).length;

    // Closed Requests: closedAt in [start, end] and status === 'closed'
    const closedCount = await Ticket.countDocuments({
      status: 'closed',
      closedAt: { $gte: start, $lte: end }
    });

    // Pending Work Verifications: status === 'verification_pending' and verification request date (completion.submittedAt) in [start, end]
    const pendingVerifications = await Ticket.find({
      status: 'verification_pending',
      'completion.submittedAt': { $gte: start, $lte: end }
    })
    .populate('dealer', 'name code email mobile')
    .populate('assignedTechnician', 'name code mobile')
    .sort({ 'completion.submittedAt': -1 });

    // New Unassigned Tickets: status === 'new' and createdAt in [start, end]
    const newUnassignedTickets = await Ticket.find({
      status: 'new',
      createdAt: { $gte: start, $lte: end }
    })
    .populate('dealer', 'name code email mobile')
    .sort({ createdAt: -1 });

    res.json({
      stats: {
        total: totalCount,
        new: newCount,
        assigned: assignedCount,
        pending: pendingCount,
        closed: closedCount
      },
      pendingVerifications,
      newUnassignedTickets
    });
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
  closeTicket,
  getCustomers,
  getDashboardStats
};
