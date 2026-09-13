const Payout = require('../models/Payout');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// Helper to attach fees to tickets (same calculation as ticketController.js)
const attachFeesToTickets = async (tickets) => {
  const Brand = require('../models/Brand');
  const brands = await Brand.find({});

  const brandFeeMap = {};
  brands.forEach((b) => {
    if (b.appliance && b.name) {
      const key = `${b.appliance.toString().trim().toLowerCase()}_${b.name.toString().trim().toLowerCase()}`;
      brandFeeMap[key] = {
        serviceFee: b.serviceFee || 0,
        installationFee: b.installationFee || 0,
        technicianServiceFee: b.technicianServiceFee !== undefined ? b.technicianServiceFee : (b.serviceFee || 0),
        technicianInstallationFee: b.technicianInstallationFee !== undefined ? b.technicianInstallationFee : (b.installationFee || 0)
      };
    }
  });

  return tickets.map((t) => {
    const ticketObj = t.toObject ? t.toObject() : t;
    if (ticketObj.technicianEarning !== undefined && ticketObj.technicianEarning !== null && typeof ticketObj.technicianEarning === 'number') {
      return ticketObj;
    }

    const appCategory = (ticketObj.product?.category || '').toString().trim().toLowerCase();
    const brandName = (ticketObj.product?.name || '').toString().trim().toLowerCase();
    const key = `${appCategory}_${brandName}`;
    const brandObj = brandFeeMap[key];

    if (brandObj) {
      if (ticketObj.type === 'service') {
        ticketObj.technicianEarning = brandObj.technicianServiceFee;
      } else if (ticketObj.type === 'installation') {
        ticketObj.technicianEarning = brandObj.technicianInstallationFee;
      } else {
        ticketObj.technicianEarning = 0;
      }
    } else {
      ticketObj.technicianEarning = 0;
    }
    return ticketObj;
  });
};

// @desc    Calculate technician total earnings for selected month & year and check payout status
// @route   GET /api/payouts/calculate
// @access  Private (Admin)
const calculateTechnicianPayout = async (req, res) => {
  try {
    const { technicianId, month, year } = req.query;

    if (!technicianId || !month || !year) {
      return res.status(400).json({ message: 'Technician, month, and year are required.' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const technicianUser = await User.findById(technicianId).select('name code mobile email role walletBalance');
    if (!technicianUser) {
      return res.status(404).json({ message: 'Technician not found.' });
    }

    // Date range for the calendar month
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    // Find completed/closed tickets for this technician in this month
    const completedTickets = await Ticket.find({
      assignedTechnician: technicianId,
      status: { $in: ['completed', 'closed'] },
      $or: [
        { 'completion.submittedAt': { $gte: start, $lte: end } },
        { 'completion.submittedAt': { $exists: false }, createdAt: { $gte: start, $lte: end } },
        { closedAt: { $gte: start, $lte: end } }
      ]
    }).populate('dealer', 'name code');

    const ticketsWithFees = await attachFeesToTickets(completedTickets);

    let totalEarnings = 0;
    let serviceEarnings = 0;
    let installationEarnings = 0;
    let completedServiceJobsCount = 0;
    let completedInstallationJobsCount = 0;

    ticketsWithFees.forEach((t) => {
      const earning = typeof t.technicianEarning === 'number' ? t.technicianEarning : 0;
      totalEarnings += earning;
      if (t.type === 'service') {
        completedServiceJobsCount += 1;
        serviceEarnings += earning;
      } else if (t.type === 'installation') {
        completedInstallationJobsCount += 1;
        installationEarnings += earning;
      }
    });

    // Check existing payout record
    const existingPayout = await Payout.findOne({
      technician: technicianId,
      month: m,
      year: y
    }).populate('paidBy', 'name code email');

    return res.json({
      technician: technicianUser,
      walletBalance: technicianUser.walletBalance || 0,
      month: m,
      year: y,
      totalEarnings,
      completedJobsCount: ticketsWithFees.length,
      completedServiceJobsCount,
      serviceEarnings,
      completedInstallationJobsCount,
      installationEarnings,
      payout: existingPayout || null,
      status: existingPayout ? existingPayout.status : 'unpaid'
    });
  } catch (error) {
    console.error('Error in calculateTechnicianPayout:', error);
    return res.status(500).json({ message: 'Failed to calculate technician payout', error: error.message });
  }
};

// @desc    Record anytime payout to technician
// @route   POST /api/payouts
// @access  Private (Admin)
const createPayout = async (req, res) => {
  try {
    const { technicianId, month, year, paymentMode, referenceNumber, amount, notes } = req.body;

    if (!technicianId || !paymentMode) {
      return res.status(400).json({ message: 'Technician and payment mode are required.' });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount greater than ₹0 is required.' });
    }

    const currentDate = new Date();
    const m = month ? parseInt(month, 10) : currentDate.getMonth() + 1;
    const y = year ? parseInt(year, 10) : currentDate.getFullYear();

    const technicianUser = await User.findById(technicianId);
    if (!technicianUser) {
      return res.status(404).json({ message: 'Technician not found.' });
    }

    // Create a new Payout record for this payout disbursement
    const payout = new Payout({
      technician: technicianId,
      month: m,
      year: y,
      amount: payAmount,
      status: 'paid',
      paymentMode,
      referenceNumber: referenceNumber ? referenceNumber.trim() : (notes || ''),
      paidAt: new Date(),
      paidBy: req.user ? req.user._id : null
    });

    await payout.save();

    // Automatically deduct payout amount from technician wallet
    try {
      const { debitTechnicianWallet } = require('./technicianController');
      await debitTechnicianWallet(
        technicianId,
        payAmount,
        payout._id,
        `Payout disbursed via ${paymentMode}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`,
        req.user ? req.user.name : 'Admin'
      );
    } catch (walletErr) {
      console.error('Error debiting technician wallet on payout:', walletErr);
    }

    const savedPayout = await Payout.findById(payout._id)
      .populate('technician', 'name code mobile email')
      .populate('paidBy', 'name code email');

    return res.status(201).json({
      message: `Payout of ₹${payAmount} successfully processed for ${technicianUser.name}`,
      payout: savedPayout
    });
  } catch (error) {
    console.error('Error in createPayout:', error);
    return res.status(500).json({ message: 'Failed to record payout', error: error.message });
  }
};

// @desc    Get all payouts with filters
// @route   GET /api/payouts
// @access  Private (Admin)
const getPayouts = async (req, res) => {
  try {
    const { technicianId, month, year, paymentMode, status, fromDate, toDate, page, limit } = req.query;

    let query = {};

    if (req.user && req.user.role === 'technician') {
      query.technician = req.user._id;
    } else if (technicianId && technicianId !== 'ALL') {
      query.technician = technicianId;
    }
    if (month && month !== 'ALL') {
      query.month = parseInt(month, 10);
    }
    if (year && year !== 'ALL') {
      query.year = parseInt(year, 10);
    }
    if (paymentMode && paymentMode !== 'ALL') {
      query.paymentMode = paymentMode;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setUTCHours(23, 59, 59, 999);
      query.paidAt = { $gte: start, $lte: end };
    }

    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    const skip = (p - 1) * l;

    const payouts = await Payout.find(query)
      .populate('technician', 'name code mobile email')
      .populate('paidBy', 'name code email')
      .sort({ paidAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await Payout.countDocuments(query);

    return res.json({
      payouts,
      total,
      page: p,
      pages: Math.ceil(total / l)
    });
  } catch (error) {
    console.error('Error in getPayouts:', error);
    return res.status(500).json({ message: 'Failed to fetch payout records', error: error.message });
  }
};

module.exports = {
  calculateTechnicianPayout,
  createPayout,
  getPayouts
};
