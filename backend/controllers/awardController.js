const Award = require('../models/Award');

// @desc    Get all active awards
// @route   GET /api/awards
// @access  Public
const getAwards = async (req, res) => {
  try {
    const awards = await Award.find({ status: 'Active' }).sort({ displayOrder: 1, createdAt: 1 });
    res.json(awards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all awards (including inactive)
// @route   GET /api/awards/all
// @access  Private (Admin)
const getAllAwards = async (req, res) => {
  try {
    const awards = await Award.find({}).sort({ displayOrder: 1, createdAt: 1 });
    res.json(awards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an award
// @route   POST /api/awards
// @access  Private (Admin)
const createAward = async (req, res) => {
  const { image, displayOrder, status } = req.body;

  try {
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }
    if (displayOrder === undefined || isNaN(Number(displayOrder))) {
      return res.status(400).json({ message: 'Display order is mandatory and must be numeric' });
    }

    const award = await Award.create({ image, displayOrder, status });
    res.status(201).json(award);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an award
// @route   PUT /api/awards/:id
// @access  Private (Admin)
const updateAward = async (req, res) => {
  const { image, displayOrder, status } = req.body;

  try {
    const award = await Award.findById(req.params.id);
    if (award) {
      award.image = image !== undefined ? image : award.image;
      if (displayOrder !== undefined) {
        if (isNaN(Number(displayOrder))) {
          return res.status(400).json({ message: 'Display order must be numeric' });
        }
        award.displayOrder = displayOrder;
      }
      award.status = status || award.status;

      const updated = await award.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Award not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an award
// @route   DELETE /api/awards/:id
// @access  Private (Admin)
const deleteAward = async (req, res) => {
  try {
    const award = await Award.findById(req.params.id);
    if (award) {
      await award.deleteOne();
      res.json({ message: 'Award removed' });
    } else {
      res.status(404).json({ message: 'Award not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAwards,
  getAllAwards,
  createAward,
  updateAward,
  deleteAward
};
