const VideoLibrary = require('../models/VideoLibrary');

// @desc    Get all video library items with optional filters
// @route   GET /api/video-library
// @access  Private
const getVideoLibraryItems = async (req, res) => {
  try {
    const { appliance, brand, search } = req.query;
    let query = {};

    if (appliance) {
      query.appliance = appliance;
    }
    if (brand) {
      query.brand = brand;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await VideoLibrary.find(query)
      .populate('appliance', 'name')
      .populate('brand', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create video library item
// @route   POST /api/video-library
// @access  Private/Admin
const createVideoLibraryItem = async (req, res) => {
  try {
    const { title, appliance, brand, description, videoUrl } = req.body;

    if (!title || !appliance || !brand || !videoUrl) {
      return res.status(400).json({ message: 'Title, appliance, brand, and video link are required.' });
    }

    const item = await VideoLibrary.create({
      title,
      appliance,
      brand,
      description: description || '',
      videoUrl,
      createdBy: req.user?._id
    });

    const populated = await VideoLibrary.findById(item._id)
      .populate('appliance', 'name')
      .populate('brand', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update video library item
// @route   PUT /api/video-library/:id
// @access  Private/Admin
const updateVideoLibraryItem = async (req, res) => {
  try {
    const { title, appliance, brand, description, videoUrl } = req.body;

    const item = await VideoLibrary.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Video item not found' });
    }

    if (title) item.title = title;
    if (appliance) item.appliance = appliance;
    if (brand) item.brand = brand;
    if (description !== undefined) item.description = description;
    if (videoUrl) item.videoUrl = videoUrl;

    await item.save();

    const populated = await VideoLibrary.findById(item._id)
      .populate('appliance', 'name')
      .populate('brand', 'name')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete video library item
// @route   DELETE /api/video-library/:id
// @access  Private/Admin
const deleteVideoLibraryItem = async (req, res) => {
  try {
    const item = await VideoLibrary.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Video item not found' });
    }

    await VideoLibrary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video library item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVideoLibraryItems,
  createVideoLibraryItem,
  updateVideoLibraryItem,
  deleteVideoLibraryItem
};
