const Brand = require('../models/Brand');
const Appliance = require('../models/Appliance');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Private
const getBrands = async (req, res) => {
  try {
    const { appliance, active } = req.query;
    let query = {};

    if (appliance) {
      query.appliance = appliance;
    }
    if (active === 'true') {
      query.isActive = true;
    }

    const brands = await Brand.find(query)
      .populate('appliance', 'name isActive')
      .sort({ name: 1 });

    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new brand
// @route   POST /api/brands
// @access  Private/Admin
const createBrand = async (req, res) => {
  const { name, applianceId, followUpDays, serviceFee, installationFee } = req.body;
  if (!name || !applianceId || followUpDays === undefined) {
    return res.status(400).json({ message: 'All fields (name, applianceId, followUpDays) are required' });
  }

  const days = parseInt(followUpDays, 10);
  if (isNaN(days) || days <= 0) {
    return res.status(400).json({ message: 'Follow-up days must be a positive integer' });
  }

  let parsedServiceFee = 0;
  if (serviceFee !== undefined) {
    parsedServiceFee = parseFloat(serviceFee);
    if (isNaN(parsedServiceFee) || parsedServiceFee < 0) {
      return res.status(400).json({ message: 'Service fee must be a non-negative number' });
    }
  }

  let parsedInstallationFee = 0;
  if (installationFee !== undefined) {
    parsedInstallationFee = parseFloat(installationFee);
    if (isNaN(parsedInstallationFee) || parsedInstallationFee < 0) {
      return res.status(400).json({ message: 'Installation fee must be a non-negative number' });
    }
  }

  try {
    // Check if appliance exists
    const appliance = await Appliance.findById(applianceId);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }

    // Check for duplicate brand under the same appliance
    const existing = await Brand.findOne({
      appliance: applianceId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ message: 'Brand already exists for this appliance' });
    }

    const brand = new Brand({
      name: name.trim(),
      appliance: applianceId,
      followUpDays: days,
      serviceFee: parsedServiceFee,
      installationFee: parsedInstallationFee
    });

    const createdBrand = await brand.save();
    res.status(201).json(createdBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
const updateBrand = async (req, res) => {
  const { name, followUpDays, serviceFee, installationFee } = req.body;

  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    if (name !== undefined) {
      // Check for duplicate name under same appliance
      const existing = await Brand.findOne({
        _id: { $ne: req.params.id },
        appliance: brand.appliance,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ message: 'Brand name already exists for this appliance' });
      }
      brand.name = name.trim();
    }

    if (followUpDays !== undefined) {
      const days = parseInt(followUpDays, 10);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ message: 'Follow-up days must be a positive integer' });
      }
      brand.followUpDays = days;
    }

    if (serviceFee !== undefined) {
      const parsedServiceFee = parseFloat(serviceFee);
      if (isNaN(parsedServiceFee) || parsedServiceFee < 0) {
        return res.status(400).json({ message: 'Service fee must be a non-negative number' });
      }
      brand.serviceFee = parsedServiceFee;
    }

    if (installationFee !== undefined) {
      const parsedInstallationFee = parseFloat(installationFee);
      if (isNaN(parsedInstallationFee) || parsedInstallationFee < 0) {
        return res.status(400).json({ message: 'Installation fee must be a non-negative number' });
      }
      brand.installationFee = parsedInstallationFee;
    }

    const updatedBrand = await brand.save();
    res.json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle brand active status
// @route   PATCH /api/brands/:id/toggle
// @access  Private/Admin
const toggleBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    brand.isActive = !brand.isActive;
    const updatedBrand = await brand.save();
    res.json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBrands,
  createBrand,
  updateBrand,
  toggleBrand,
  deleteBrand
};
