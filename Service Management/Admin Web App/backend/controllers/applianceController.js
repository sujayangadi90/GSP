const Appliance = require('../models/Appliance');
const Brand = require('../models/Brand');

// @desc    Get all appliances
// @route   GET /api/appliances
// @access  Private
const getAppliances = async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    const appliances = await Appliance.find(query).sort({ name: 1 });
    res.json(appliances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new appliance
// @route   POST /api/appliances
// @access  Private/Admin
const createAppliance = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Appliance name is required' });
  }

  try {
    const existing = await Appliance.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Appliance already exists' });
    }

    const appliance = new Appliance({ name: name.trim() });
    const createdAppliance = await appliance.save();
    res.status(201).json(createdAppliance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an appliance
// @route   PUT /api/appliances/:id
// @access  Private/Admin
const updateAppliance = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Appliance name is required' });
  }

  try {
    const appliance = await Appliance.findById(req.params.id);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }

    const existing = await Appliance.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ message: 'Appliance name already exists' });
    }

    appliance.name = name.trim();
    const updatedAppliance = await appliance.save();
    res.json(updatedAppliance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle appliance active status
// @route   PATCH /api/appliances/:id/toggle
// @access  Private/Admin
const toggleAppliance = async (req, res) => {
  try {
    const appliance = await Appliance.findById(req.params.id);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }

    appliance.isActive = !appliance.isActive;
    const updatedAppliance = await appliance.save();
    res.json(updatedAppliance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an appliance
// @route   DELETE /api/appliances/:id
// @access  Private/Admin
const deleteAppliance = async (req, res) => {
  try {
    const appliance = await Appliance.findById(req.params.id);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }

    // Check if any brands are linked to this appliance
    const brandsCount = await Brand.countDocuments({ appliance: req.params.id });
    if (brandsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete appliance. It has associated brands.' });
    }

    await Appliance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appliance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAppliances,
  createAppliance,
  updateAppliance,
  toggleAppliance,
  deleteAppliance
};
