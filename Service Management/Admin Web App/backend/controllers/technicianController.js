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

    const transactions = await WalletTransaction.find({ technician: req.params.id })
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

    const transactions = await WalletTransaction.find({ technician: technicianId })
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

module.exports = {
  getTechnicians,
  addTechnician,
  getTechnicianById,
  updateTechnician,
  toggleTechnicianStatus,
  creditTechnicianWallet,
  debitTechnicianWallet,
  getTechnicianWallet,
  getTechnicianWalletSelf
};

