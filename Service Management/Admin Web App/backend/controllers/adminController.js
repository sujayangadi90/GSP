const User = require('../models/User');

const isSuperAdmin = (admin) => {
  if (!admin) return false;
  const email = (admin.email || '').trim().toLowerCase();
  const code = (admin.code || '').trim().toUpperCase();
  const name = (admin.name || '').trim().toLowerCase();
  return email === 'admin@gsp.com' || code === 'ADMIN-01' || name === 'gsp super admin';
};

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

    if (email.trim().toLowerCase() === 'admin@gsp.com') {
      return res.status(400).json({ message: 'Cannot create an account with the protected Super Admin email address.' });
    }

    const adminExists = await User.findOne({ email: email.trim().toLowerCase() });
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
      email: email.trim().toLowerCase(),
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
        amcs: true,
        inventory: true,
        performance: true,
        reports: true,
        videoLibrary: true,
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

    // Protect GSP Super Admin from any modifications
    if (isSuperAdmin(admin)) {
      return res.status(403).json({ message: 'The GSP Super Admin account is system protected and cannot be edited or modified.' });
    }

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
        amcs: permissions.amcs !== undefined ? permissions.amcs : (admin.permissions.amcs !== undefined ? admin.permissions.amcs : true),
        inventory: permissions.inventory !== undefined ? permissions.inventory : (admin.permissions.inventory !== undefined ? admin.permissions.inventory : true),
        performance: permissions.performance !== undefined ? permissions.performance : (admin.permissions.performance !== undefined ? admin.permissions.performance : true),
        reports: permissions.reports !== undefined ? permissions.reports : (admin.permissions.reports !== undefined ? admin.permissions.reports : true),
        videoLibrary: permissions.videoLibrary !== undefined ? permissions.videoLibrary : (admin.permissions.videoLibrary !== undefined ? admin.permissions.videoLibrary : true),
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

    // Protect GSP Super Admin from status toggle / deactivation
    if (isSuperAdmin(admin)) {
      return res.status(403).json({ message: 'The GSP Super Admin account is system protected and cannot be deactivated or status modified.' });
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

// @desc    Get system memory and storage usage for uploads
// @route   GET /api/admins/memory-usage
// @access  Private/Admin
const getMemoryUsage = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '..', 'uploads');

    let totalBytes = 0;
    let totalFiles = 0;

    const breakdown = {
      ticketPhotos: { label: 'Ticket Completion Photos', count: 0, bytes: 0 },
      attendanceSelfies: { label: 'Attendance Selfies', count: 0, bytes: 0 },
      employeeDocs: { label: 'Employee & Identity Documents', count: 0, bytes: 0 },
      dealerVideos: { label: 'Dealer & Training Videos', count: 0, bytes: 0 },
      otherFiles: { label: 'Other Attachments', count: 0, bytes: 0 }
    };

    function scanDir(directory) {
      if (!fs.existsSync(directory)) return;
      const files = fs.readdirSync(directory);
      files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else {
          const size = stat.size;
          totalBytes += size;
          totalFiles += 1;
          const lowerName = file.toLowerCase();

          if (lowerName.startsWith('photos-') || lowerName.startsWith('ticket-')) {
            breakdown.ticketPhotos.count += 1;
            breakdown.ticketPhotos.bytes += size;
          } else if (lowerName.startsWith('selfie-') || lowerName.includes('selfie')) {
            breakdown.attendanceSelfies.count += 1;
            breakdown.attendanceSelfies.bytes += size;
          } else if (
            lowerName.startsWith('aadhar-') ||
            lowerName.startsWith('license-') ||
            lowerName.startsWith('insurance-') ||
            lowerName.startsWith('profile-')
          ) {
            breakdown.employeeDocs.count += 1;
            breakdown.employeeDocs.bytes += size;
          } else if (
            lowerName.endsWith('.mp4') ||
            lowerName.endsWith('.mov') ||
            lowerName.endsWith('.avi') ||
            lowerName.includes('video')
          ) {
            breakdown.dealerVideos.count += 1;
            breakdown.dealerVideos.bytes += size;
          } else {
            breakdown.otherFiles.count += 1;
            breakdown.otherFiles.bytes += size;
          }
        }
      });
    }

    scanDir(uploadDir);

    const formatBytes = (bytes) => {
      if (!bytes || bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formattedBreakdown = {};
    Object.keys(breakdown).forEach(key => {
      formattedBreakdown[key] = {
        ...breakdown[key],
        formattedSize: formatBytes(breakdown[key].bytes),
        percentage: totalBytes > 0 ? parseFloat(((breakdown[key].bytes / totalBytes) * 100).toFixed(1)) : 0
      };
    });

    res.json({
      totalBytes,
      totalFiles,
      formattedTotalSize: formatBytes(totalBytes),
      breakdown: formattedBreakdown,
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdmins,
  addAdmin,
  updateAdmin,
  toggleAdminStatus,
  getMemoryUsage
};

