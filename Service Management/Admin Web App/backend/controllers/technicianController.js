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
  const { name, mobile, email, password, appliances, drivingLicense, aadhar, insurance, pincodes } = req.body;

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

    const technician = await User.create({
      name,
      mobile,
      email,
      password: password || 'tech@123', // default password if not provided
      role: 'technician',
      code,
      appliances: appliances || [],
      drivingLicense: drivingLicense || '',
      aadhar: aadhar || '',
      insurance: insurance || '',
      pincodes: pincodes || []
    });

    res.status(201).json({
      _id: technician._id,
      name: technician.name,
      code: technician.code,
      email: technician.email,
      mobile: technician.mobile,
      appliances: technician.appliances,
      drivingLicense: technician.drivingLicense,
      aadhar: technician.aadhar,
      insurance: technician.insurance,
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

    if (req.body.drivingLicense !== undefined) {
      technician.drivingLicense = req.body.drivingLicense;
    }

    if (req.body.aadhar !== undefined) {
      technician.aadhar = req.body.aadhar;
    }

    if (req.body.insurance !== undefined) {
      technician.insurance = req.body.insurance;
    }

    if (req.body.pincodes !== undefined) {
      technician.pincodes = req.body.pincodes;
    }

    const updatedTech = await technician.save();
    res.json({
      _id: updatedTech._id,
      name: updatedTech.name,
      code: updatedTech.code,
      email: updatedTech.email,
      mobile: updatedTech.mobile,
      status: updatedTech.status,
      appliances: updatedTech.appliances,
      drivingLicense: updatedTech.drivingLicense,
      aadhar: updatedTech.aadhar,
      insurance: updatedTech.insurance,
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

module.exports = { getTechnicians, addTechnician, getTechnicianById, updateTechnician, toggleTechnicianStatus };
