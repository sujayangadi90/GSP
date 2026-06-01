const Brand = require('../models/Brand');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({});
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a brand
// @route   POST /api/brands
// @access  Private (Admin)
const createBrand = async (req, res) => {
  const { name, logo, description, associatedServices } = req.body;

  try {
    const brand = await Brand.create({ name, logo, description, associatedServices });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private (Admin)
const updateBrand = async (req, res) => {
  const { name, logo, description, associatedServices } = req.body;

  try {
    const brand = await Brand.findById(req.params.id);
    if (brand) {
      brand.name = name || brand.name;
      brand.logo = logo !== undefined ? logo : brand.logo;
      brand.description = description !== undefined ? description : brand.description;
      brand.associatedServices = associatedServices || brand.associatedServices;

      const updated = await brand.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private (Admin)
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (brand) {
      await brand.deleteOne();
      res.json({ message: 'Brand removed' });
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };
