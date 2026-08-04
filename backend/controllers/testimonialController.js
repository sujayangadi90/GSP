const Testimonial = require('../models/Testimonial');

// @desc    Get all active testimonials
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isPublished: true });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all testimonials (including unpublished for admin)
// @route   GET /api/testimonials/all
// @access  Private (Admin)
const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({});
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a testimonial
// @route   POST /api/testimonials
// @access  Private (Admin)
const createTestimonial = async (req, res) => {
  const { name, review, rating, isPublished } = req.body;

  try {
    const testimonial = await Testimonial.create({ name, review, rating, isPublished });
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
const updateTestimonial = async (req, res) => {
  const { name, review, rating, isPublished } = req.body;

  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (testimonial) {
      testimonial.name = name || testimonial.name;
      testimonial.review = review || testimonial.review;
      testimonial.rating = rating !== undefined ? rating : testimonial.rating;
      testimonial.isPublished = isPublished !== undefined ? isPublished : testimonial.isPublished;

      const updated = await testimonial.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Testimonial not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin)
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (testimonial) {
      await testimonial.deleteOne();
      res.json({ message: 'Testimonial removed' });
    } else {
      res.status(404).json({ message: 'Testimonial not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
