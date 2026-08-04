const Gallery = require('../models/Gallery');

// @desc    Get all active gallery images
// @route   GET /api/gallery
// @access  Public
const getGalleryImages = async (req, res) => {
  try {
    const images = await Gallery.find({ status: 'Active' }).sort({ displayOrder: 1, createdAt: 1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all gallery images (including inactive)
// @route   GET /api/gallery/all
// @access  Private (Admin)
const getAllGalleryImages = async (req, res) => {
  try {
    const images = await Gallery.find({}).sort({ displayOrder: 1, createdAt: 1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a gallery image
// @route   POST /api/gallery
// @access  Private (Admin)
const createGalleryImage = async (req, res) => {
  const { image, displayOrder, status } = req.body;

  try {
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }
    if (displayOrder === undefined || isNaN(Number(displayOrder))) {
      return res.status(400).json({ message: 'Display order is mandatory and must be numeric' });
    }

    const galleryItem = await Gallery.create({ image, displayOrder, status });
    res.status(201).json(galleryItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a gallery image
// @route   PUT /api/gallery/:id
// @access  Private (Admin)
const updateGalleryImage = async (req, res) => {
  const { image, displayOrder, status } = req.body;

  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (galleryItem) {
      galleryItem.image = image !== undefined ? image : galleryItem.image;
      if (displayOrder !== undefined) {
        if (isNaN(Number(displayOrder))) {
          return res.status(400).json({ message: 'Display order must be numeric' });
        }
        galleryItem.displayOrder = displayOrder;
      }
      galleryItem.status = status || galleryItem.status;

      const updated = await galleryItem.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Gallery image not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a gallery image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
const deleteGalleryImage = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (galleryItem) {
      await galleryItem.deleteOne();
      res.json({ message: 'Gallery image removed' });
    } else {
      res.status(404).json({ message: 'Gallery image not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGalleryImages,
  getAllGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
};
