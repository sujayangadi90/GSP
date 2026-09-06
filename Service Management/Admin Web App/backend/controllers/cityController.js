const City = require('../models/City');

// @desc    Get all cities
// @route   GET /api/cities
// @access  Private
const getCities = async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    const cities = await City.find(query).sort({ name: 1 });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new city
// @route   POST /api/cities
// @access  Private/Admin
const createCity = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'City name is required' });
  }

  try {
    const existing = await City.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'City already exists' });
    }

    const city = new City({ name: name.trim() });
    const createdCity = await city.save();
    res.status(201).json(createdCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a city
// @route   PUT /api/cities/:id
// @access  Private/Admin
const updateCity = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'City name is required' });
  }

  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    const existing = await City.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ message: 'City name already exists' });
    }

    city.name = name.trim();
    const updatedCity = await city.save();
    res.json(updatedCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle city active status
// @route   PATCH /api/cities/:id/toggle
// @access  Private/Admin
const toggleCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    city.isActive = !city.isActive;
    const updatedCity = await city.save();
    res.json(updatedCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a city
// @route   DELETE /api/cities/:id
// @access  Private/Admin
const deleteCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    await City.findByIdAndDelete(req.params.id);
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add taluk to a city
// @route   POST /api/cities/:id/taluks
// @access  Private/Admin
const addTaluk = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Taluk name is required' });
  }

  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    const trimmedName = name.trim();
    const existing = city.taluks.find(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'Taluk already exists in this city' });
    }

    city.taluks.push({ name: trimmedName, isActive: true });
    const updatedCity = await city.save();
    res.status(201).json(updatedCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update taluk in a city
// @route   PUT /api/cities/:id/taluks/:talukId
// @access  Private/Admin
const updateTaluk = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Taluk name is required' });
  }

  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    const taluk = city.taluks.id(req.params.talukId);
    if (!taluk) {
      return res.status(404).json({ message: 'Taluk not found' });
    }

    const trimmedName = name.trim();
    const existing = city.taluks.find(t => t._id.toString() !== req.params.talukId && t.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'Taluk name already exists in this city' });
    }

    taluk.name = trimmedName;
    const updatedCity = await city.save();
    res.json(updatedCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle taluk active status
// @route   PATCH /api/cities/:id/taluks/:talukId/toggle
// @access  Private/Admin
const toggleTaluk = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    const taluk = city.taluks.id(req.params.talukId);
    if (!taluk) {
      return res.status(404).json({ message: 'Taluk not found' });
    }

    taluk.isActive = !taluk.isActive;
    const updatedCity = await city.save();
    res.json(updatedCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete taluk from a city
// @route   DELETE /api/cities/:id/taluks/:talukId
// @access  Private/Admin
const deleteTaluk = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    city.taluks = city.taluks.filter(t => t._id.toString() !== req.params.talukId);
    const updatedCity = await city.save();
    res.json(updatedCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCities,
  createCity,
  updateCity,
  toggleCity,
  deleteCity,
  addTaluk,
  updateTaluk,
  toggleTaluk,
  deleteTaluk
};
