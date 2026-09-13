const User = require('../models/User');

// @desc    Get all technicians
// @route   GET /api/technicians
// @access  Private
const getTechnicians = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { role: 'technician' };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const technicians = await User.find(query).populate('appliances', 'name').select('-password').sort({ createdAt: -1 });
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new technician
// @route   POST /api/technicians
// @access  Private/Admin
const addTechnician = async (req, res) => {
  const { name, mobile, email, password, appliances, profilePic, drivingLicense, aadhar, insurance, bikeInsurance, bikePhoto, pincodes } = req.body;

  try {
    const techExists = await User.findOne({ email });
    if (techExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate unique Tech Code (e.g. TECH-1001)
    const lastTech = await User.findOne({ role: 'technician' }, {}, { sort: { 'createdAt': -1 } });
    let nextNum = 1001;
    if (lastTech && lastTech.code) {
      const match = lastTech.code.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const code = `TECH-${nextNum}`;

    const cleanPincodes = Array.isArray(pincodes)
      ? pincodes.map(p => String(p).trim()).filter(Boolean)
      : (typeof pincodes === 'string' ? pincodes.split(',').map(p => p.trim()).filter(Boolean) : []);

    const technician = await User.create({
      name,
      mobile,
      email,
      password: password || 'tech@123', // default password if not provided
      role: 'technician',
      code,
      appliances: appliances || [],
      profilePic: profilePic || '',
      drivingLicense: drivingLicense || '',
      aadhar: aadhar || '',
      insurance: insurance || '',
      bikeInsurance: bikeInsurance || '',
      bikePhoto: bikePhoto || '',
      pincodes: cleanPincodes
    });

    res.status(201).json({
      _id: technician._id,
      name: technician.name,
      code: technician.code,
      email: technician.email,
      mobile: technician.mobile,
      profilePic: technician.profilePic,
      appliances: technician.appliances,
      drivingLicense: technician.drivingLicense,
      aadhar: technician.aadhar,
      insurance: technician.insurance,
      bikeInsurance: technician.bikeInsurance,
      bikePhoto: technician.bikePhoto,
      pincodes: technician.pincodes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technician by ID
// @route   GET /api/technicians/:id
// @access  Private/Admin
const getTechnicianById = async (req, res) => {
  try {
    const technician = await User.findById(req.params.id).populate('appliances', 'name').select('-password');
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.json(technician);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update technician
// @route   PUT /api/technicians/:id
// @access  Private/Admin
const updateTechnician = async (req, res) => {
  try {
    const technician = await User.findById(req.params.id);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found' });
    }

    technician.name = req.body.name || technician.name;
    technician.mobile = req.body.mobile || technician.mobile;
    technician.email = req.body.email || technician.email;
    if (req.body.appliances !== undefined) {
      technician.appliances = req.body.appliances;
    }

    if (req.body.password) {
      technician.password = req.body.password;
    }

    if (req.body.profilePic !== undefined) {
      technician.profilePic = req.body.profilePic;
    }

    if (req.body.drivingLicense !== undefined) {
      technician.drivingLicense = req.body.drivingLicense;
    }

    if (req.body.aadhar !== undefined) {
      technician.aadhar = req.body.aadhar;
    }

    if (req.body.insurance !== undefined) {
      technician.insurance = req.body.insurance;
    }

    if (req.body.bikeInsurance !== undefined) {
      technician.bikeInsurance = req.body.bikeInsurance;
    }

    if (req.body.bikePhoto !== undefined) {
      technician.bikePhoto = req.body.bikePhoto;
    }

    if (req.body.pincodes !== undefined) {
      technician.pincodes = Array.isArray(req.body.pincodes)
        ? req.body.pincodes.map(p => String(p).trim()).filter(Boolean)
        : (typeof req.body.pincodes === 'string' ? req.body.pincodes.split(',').map(p => p.trim()).filter(Boolean) : []);
    }

    const updatedTech = await technician.save();
    res.json({
      _id: updatedTech._id,
      name: updatedTech.name,
      code: updatedTech.code,
      email: updatedTech.email,
      mobile: updatedTech.mobile,
      status: updatedTech.status,
      profilePic: updatedTech.profilePic,
      appliances: updatedTech.appliances,
      drivingLicense: updatedTech.drivingLicense,
      aadhar: updatedTech.aadhar,
      insurance: updatedTech.insurance,
      bikeInsurance: updatedTech.bikeInsurance,
      bikePhoto: updatedTech.bikePhoto,
      pincodes: updatedTech.pincodes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle technician active status
// @route   PATCH /api/technicians/:id/toggle
// @access  Private/Admin
const toggleTechnicianStatus = async (req, res) => {
  try {
    const technician = await User.findById(req.params.id);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found' });
    }

    technician.status = technician.status === 'active' ? 'inactive' : 'active';
    await technician.save();

    res.json({ message: `Technician account status updated to ${technician.status}`, status: technician.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const WalletTransaction = require('../models/WalletTransaction');

// Helper to credit technician wallet (addition)
const creditTechnicianWallet = async (technicianId, amount, ticketId, description, createdByName = 'System') => {
  if (!technicianId || !amount || amount <= 0) return null;
  
  // Idempotency check: avoid crediting twice for same ticket
  if (ticketId) {
    const existing = await WalletTransaction.findOne({ ticket: ticketId, type: 'credit' });
    if (existing) return existing;
  }

  const user = await User.findByIdAndUpdate(
    technicianId,
    { $inc: { walletBalance: amount } },
    { new: true }
  );

  const tx = await WalletTransaction.create({
    technician: technicianId,
    type: 'credit',
    amount: Number(amount),
    balanceAfter: user ? user.walletBalance : amount,
    source: 'ticket_earning',
    ticket: ticketId || null,
    description: description || `Job earnings credited`,
    createdByName
  });

  return tx;
};

// Helper to debit technician wallet (deduction)
const debitTechnicianWallet = async (technicianId, amount, payoutId, description, createdByName = 'System') => {
  if (!technicianId || !amount || amount <= 0) return null;

  // Idempotency check: avoid debiting twice for same payout
  if (payoutId) {
    const existing = await WalletTransaction.findOne({ payout: payoutId, type: 'debit' });
    if (existing) return existing;
  }

  const user = await User.findByIdAndUpdate(
    technicianId,
    { $inc: { walletBalance: -amount } },
    { new: true }
  );

  const tx = await WalletTransaction.create({
    technician: technicianId,
    type: 'debit',
    amount: Number(amount),
    balanceAfter: user ? user.walletBalance : 0,
    source: 'payout',
    payout: payoutId || null,
    description: description || `Payout amount deducted`,
    createdByName
  });

  return tx;
};

// @desc    Get technician wallet details & transaction history (Admin)
// @route   GET /api/technicians/:id/wallet
// @access  Private (Admin)
const getTechnicianWallet = async (req, res) => {
  try {
    const technician = await User.findById(req.params.id).select('name code email mobile walletBalance status role');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    const { fromDate, toDate, type } = req.query;
    const query = { technician: req.params.id };

    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(`${fromDate}T00:00:00`);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(`${toDate}T23:59:59.999`);
      }
    }

    const transactions = await WalletTransaction.find(query)
      .populate('ticket', 'ticketNumber type status')
      .populate('payout', 'month year amount status paymentMode referenceNumber')
      .sort({ createdAt: -1 });

    res.json({
      technician,
      walletBalance: technician.walletBalance || 0,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in technician wallet details & history (Mobile App / Self)
// @route   GET /api/technicians/me/wallet
// @access  Private (Technician)
const getTechnicianWalletSelf = async (req, res) => {
  try {
    const technicianId = req.user._id;
    const technician = await User.findById(technicianId).select('name code email mobile walletBalance');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    const { fromDate, toDate, type } = req.query;
    const query = { technician: technicianId };

    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(`${fromDate}T00:00:00`);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(`${toDate}T23:59:59.999`);
      }
    }

    const transactions = await WalletTransaction.find(query)
      .populate('ticket', 'ticketNumber type status')
      .populate('payout', 'month year amount status paymentMode referenceNumber')
      .sort({ createdAt: -1 });

    res.json({
      walletBalance: technician.walletBalance || 0,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync / Backfill past tickets earnings and payouts into Technician Wallets (Admin)
// @route   POST /api/technicians/sync-wallets
// @access  Private (Admin)
const syncPastWalletTransactions = async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    const Payout = require('../models/Payout');
    const Brand = require('../models/Brand');

    // 1. Fetch brands to attach fees
    const brands = await Brand.find({}).populate('appliance');
    const brandFeeMap = {};
    const brandByNameMap = {};
    brands.forEach((b) => {
      const appName = b.appliance ? b.appliance.name.toString().trim().toLowerCase() : '';
      const bName = b.name.toString().trim().toLowerCase();
      const feeData = {
        serviceFee: b.serviceFee || 0,
        installationFee: b.installationFee || 0,
        technicianServiceFee: b.technicianServiceFee !== undefined ? b.technicianServiceFee : (b.serviceFee || 0),
        technicianInstallationFee: b.technicianInstallationFee !== undefined ? b.technicianInstallationFee : (b.installationFee || 0)
      };
      brandFeeMap[`${appName}_${bName}`] = feeData;
      if (!brandByNameMap[bName]) brandByNameMap[bName] = feeData;
    });

    // 2. Fetch all completed or closed tickets with assigned technicians
    const tickets = await Ticket.find({
      status: { $in: ['completed', 'closed'] },
      assignedTechnician: { $exists: true, $ne: null }
    }).sort({ createdAt: 1 });

    let creditedCount = 0;
    let totalCreditedAmount = 0;

    for (const t of tickets) {
      // Check if already credited
      const existingCredit = await WalletTransaction.findOne({ ticket: t._id, type: 'credit' });
      if (existingCredit) continue;

      let earning = typeof t.technicianEarning === 'number' ? t.technicianEarning : null;
      if (earning === null || earning <= 0) {
        const appCategory = (t.product?.category || '').toString().trim().toLowerCase();
        const brandName = (t.product?.name || '').toString().trim().toLowerCase();
        const brandObj = brandFeeMap[`${appCategory}_${brandName}`] || brandByNameMap[brandName];
        if (brandObj) {
          if (t.type === 'service') {
            earning = brandObj.technicianServiceFee;
          } else if (t.type === 'installation') {
            earning = brandObj.technicianInstallationFee;
          }
        }
      }

      const creditAmt = Number(earning) || 0;
      if (creditAmt > 0) {
        await creditTechnicianWallet(
          t.assignedTechnician,
          creditAmt,
          t._id,
          `Earnings credited for Ticket #${t.ticketNumber || t._id} (Historical Sync)`,
          req.user ? req.user.name : 'System Sync'
        );
        creditedCount++;
        totalCreditedAmount += creditAmt;
      }
    }

    // 3. Fetch all paid payouts
    const payouts = await Payout.find({ status: 'paid' }).sort({ paidAt: 1, createdAt: 1 });
    let debitedCount = 0;
    let totalDebitedAmount = 0;

    for (const p of payouts) {
      const existingDebit = await WalletTransaction.findOne({ payout: p._id, type: 'debit' });
      if (existingDebit) continue;

      const debitAmt = Number(p.amount) || 0;
      if (debitAmt > 0 && p.technician) {
        await debitTechnicianWallet(
          p.technician,
          debitAmt,
          p._id,
          `Payout disbursed for ${p.month}/${p.year} via ${p.paymentMode || 'Paid'} (Historical Sync)`,
          req.user ? req.user.name : 'System Sync'
        );
        debitedCount++;
        totalDebitedAmount += debitAmt;
      }
    }

    res.json({
      message: 'Technician wallets successfully synced with past historical data.',
      summary: {
        ticketsProcessed: tickets.length,
        creditedCount,
        totalCreditedAmount,
        payoutsProcessed: payouts.length,
        debitedCount,
        totalDebitedAmount
      }
    });
  } catch (error) {
    console.error('Error syncing past wallet transactions:', error);
    res.status(500).json({ message: 'Failed to sync past wallet transactions', error: error.message });
  }
};

module.exports = {
  getTechnicians,
  addTechnician,
  getTechnicianById,
  updateTechnician,
  toggleTechnicianStatus,
  creditTechnicianWallet,
  debitTechnicianWallet,
  getTechnicianWallet,
  getTechnicianWalletSelf,
  syncPastWalletTransactions
};

