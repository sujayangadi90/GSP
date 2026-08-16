const User = require('../models/User');

// @desc    Get all admin users
// @route   GET /api/admins
// @access  Private/Admin
const getAdmins = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'admin' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Do not return the current logged-in admin in the list to avoid self-lockouts/accidental changes,
    // or return all admins. Usually returning all is expected. Let's return all.
    const admins = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new admin user
// @route   POST /api/admins
// @access  Private/Admin
const addAdmin = async (req, res) => {
  const { name, email, password, status, permissions } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate Admin Code (e.g. ADM-1001)
    const lastAdmin = await User.findOne({ role: 'admin' }, {}, { sort: { 'createdAt': -1 } });
    let nextNum = 1001;
    if (lastAdmin && lastAdmin.code) {
      const match = lastAdmin.code.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const code = `ADM-${nextNum}`;

    const adminName = name || email.split('@')[0];

    const admin = await User.create({
      name: adminName,
      email,
      password,
      role: 'admin',
      code,
      status: status || 'active',
      permissions: permissions || {
        dashboard: true,
        tickets: true,
        customers: true,
        manageDealers: true,
        manageTechnicians: true,
        followups: true,
        settings: true
      }
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      code: admin.code,
      email: admin.email,
      status: admin.status,
      permissions: admin.permissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update admin user
// @route   PUT /api/admins/:id
// @access  Private/Admin
const updateAdmin = async (req, res) => {
  const { name, email, password, status, permissions } = req.body;

  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Don't allow changing the main super admin (or allow if not self)
    // For simplicity, allow updating name, email, status, permissions
    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.status = status || admin.status;
    
    if (permissions) {
      admin.permissions = {
        dashboard: permissions.dashboard !== undefined ? permissions.dashboard : admin.permissions.dashboard,
        tickets: permissions.tickets !== undefined ? permissions.tickets : admin.permissions.tickets,
        customers: permissions.customers !== undefined ? permissions.customers : admin.permissions.customers,
        manageDealers: permissions.manageDealers !== undefined ? permissions.manageDealers : admin.permissions.manageDealers,
        manageTechnicians: permissions.manageTechnicians !== undefined ? permissions.manageTechnicians : admin.permissions.manageTechnicians,
        followups: permissions.followups !== undefined ? permissions.followups : admin.permissions.followups,
        settings: permissions.settings !== undefined ? permissions.settings : admin.permissions.settings,
      };
    }

    if (password) {
      admin.password = password;
    }

    const updatedAdmin = await admin.save();
    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      code: updatedAdmin.code,
      email: updatedAdmin.email,
      status: updatedAdmin.status,
      permissions: updatedAdmin.permissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle admin status (active/inactive)
// @route   PATCH /api/admins/:id/toggle
// @access  Private/Admin
const toggleAdminStatus = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Prevent deactivating own account
    if (admin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    admin.status = admin.status === 'active' ? 'inactive' : 'active';
    await admin.save();

    res.json({
      _id: admin._id,
      status: admin.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdmins,
  addAdmin,
  updateAdmin,
  toggleAdminStatus
};
