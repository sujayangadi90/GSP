const Banner = require('../models/Banner');

// @desc    Get all active banners
// @route   GET /api/banners
// @access  Public
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ status: 'Active' }).sort({ displayOrder: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all banners (including inactive)
// @route   GET /api/banners/all
// @access  Private (Admin)
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ displayOrder: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private (Admin)
const createBanner = async (req, res) => {
  const { title, image, displayOrder, status } = req.body;

  try {
    const banner = await Banner.create({ title, image, displayOrder, status });
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private (Admin)
const updateBanner = async (req, res) => {
  const { title, image, displayOrder, status } = req.body;

  try {
    const banner = await Banner.findById(req.params.id);
    if (banner) {
      banner.title = title || banner.title;
      banner.image = image !== undefined ? image : banner.image;
      banner.displayOrder = displayOrder !== undefined ? displayOrder : banner.displayOrder;
      banner.status = status || banner.status;

      const updated = await banner.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private (Admin)
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (banner) {
      await banner.deleteOne();
      res.json({ message: 'Banner removed' });
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
};
