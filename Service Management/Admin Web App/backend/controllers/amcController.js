const Amc = require('../models/Amc');
const Customer = require('../models/Customer');
const Appliance = require('../models/Appliance');
const FollowUp = require('../models/FollowUp');

const calculateStatus = (startDate, endDate, currentStatus) => {
  if (currentStatus === 'cancelled') return 'cancelled';
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'active';
  return 'expired';
};

// @desc    Create new AMC contract
// @route   POST /api/amcs
// @access  Private/Admin
const createAmc = async (req, res) => {
  const { customer, appliance, startDate, endDate, amcType, amcAmount, visitsIncluded, includedServices, notes } = req.body;

  try {
    const status = calculateStatus(startDate, endDate, 'upcoming');
    const amc = await Amc.create({
      customer,
      appliance,
      startDate,
      endDate,
      amcType,
      amcAmount,
      visitsIncluded,
      includedServices: includedServices || '',
      notes: notes || '',
      status
    });

    // Auto-schedule FollowUp visits evenly across contract period
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const count = Number(visitsIncluded) || 4;
      for (let i = 1; i <= count; i++) {
        const dueTime = start.getTime() + (diffTime * i) / (count + 1);
        await FollowUp.create({
          amc: amc._id,
          category: 'amc',
          dueAt: new Date(dueTime),
          status: 'new'
        });
      }
    } catch (followUpErr) {
      console.error('Failed to auto-schedule AMC follow-ups:', followUpErr.message);
    }

    const populated = await Amc.findById(amc._id).populate('customer').populate('appliance');
    res.status(201).json(populated);
  } catch (error) {
    res.status(550).json({ message: error.message });
  }
};

// @desc    Get all AMC contracts
// @route   GET /api/amcs
// @access  Private/Admin
const getAmcs = async (req, res) => {
  try {
    const { search, amcType, status, appliance, fromDate, toDate, customerId } = req.query;
    let query = {};

    if (customerId) {
      query.customer = customerId;
    }
    if (amcType) {
      query.amcType = amcType;
    }
    if (appliance) {
      query.appliance = appliance;
    }
    if (fromDate || toDate) {
      query.startDate = {};
      if (fromDate) query.startDate.$gte = new Date(fromDate);
      if (toDate) query.startDate.$lte = new Date(toDate);
    }

    let amcs = await Amc.find(query).populate('customer').populate('appliance').sort({ createdAt: -1 });

    const now = new Date();
    let modified = false;
    for (let amc of amcs) {
      if (amc.status !== 'cancelled') {
        const newStatus = calculateStatus(amc.startDate, amc.endDate, amc.status);
        if (amc.status !== newStatus) {
          amc.status = newStatus;
          await amc.save();
          modified = true;
        }
      }
    }

    if (modified) {
      amcs = await Amc.find(query).populate('customer').populate('appliance').sort({ createdAt: -1 });
    }

    if (search) {
      const s = search.toLowerCase();
      amcs = amcs.filter(amc => {
        return (
          (amc.customer?.name && amc.customer.name.toLowerCase().includes(s)) ||
          (amc.customer?.mobile && amc.customer.mobile.includes(s)) ||
          (amc.appliance?.name && amc.appliance.name.toLowerCase().includes(s))
        );
      });
    }

    if (status) {
      amcs = amcs.filter(amc => amc.status === status);
    }

    res.json(amcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AMC by ID
// @route   GET /api/amcs/:id
// @access  Private/Admin
const getAmcById = async (req, res) => {
  try {
    const amc = await Amc.findById(req.params.id).populate('customer').populate('appliance');
    if (!amc) {
      return res.status(404).json({ message: 'AMC Contract not found' });
    }
    res.json(amc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update AMC contract
// @route   PUT /api/amcs/:id
// @access  Private/Admin
const updateAmc = async (req, res) => {
  try {
    const amc = await Amc.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ message: 'AMC Contract not found' });
    }

    amc.customer = req.body.customer || amc.customer;
    amc.appliance = req.body.appliance || amc.appliance;
    amc.startDate = req.body.startDate || amc.startDate;
    amc.endDate = req.body.endDate || amc.endDate;
    amc.amcType = req.body.amcType || amc.amcType;
    amc.amcAmount = req.body.amcAmount !== undefined ? req.body.amcAmount : amc.amcAmount;
    amc.visitsIncluded = req.body.visitsIncluded !== undefined ? req.body.visitsIncluded : amc.visitsIncluded;
    amc.visitsUsed = req.body.visitsUsed !== undefined ? req.body.visitsUsed : amc.visitsUsed;
    amc.includedServices = req.body.includedServices !== undefined ? req.body.includedServices : amc.includedServices;
    amc.notes = req.body.notes !== undefined ? req.body.notes : amc.notes;

    if (req.body.status) {
      amc.status = req.body.status;
    } else {
      amc.status = calculateStatus(amc.startDate, amc.endDate, amc.status);
    }

    const updated = await amc.save();
    const populated = await Amc.findById(updated._id).populate('customer').populate('appliance');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel AMC contract
// @route   PATCH /api/amcs/:id/cancel
// @access  Private/Admin
const cancelAmc = async (req, res) => {
  try {
    const amc = await Amc.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ message: 'AMC Contract not found' });
    }

    amc.status = 'cancelled';
    await amc.save();
    res.json({ message: 'AMC Contract status updated to cancelled', status: 'cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAmc,
  getAmcs,
  getAmcById,
  updateAmc,
  cancelAmc
};
