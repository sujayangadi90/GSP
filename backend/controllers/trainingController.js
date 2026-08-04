const TrainingLead = require('../models/TrainingLead');

// @desc    Submit a new training center lead
// @route   POST /api/training/leads
// @access  Public
const submitLead = async (req, res) => {
  const { name, phone, city } = req.body;

  try {
    if (!name || !phone || !city) {
      return res.status(400).json({ message: 'Name, Phone Number, and City are required' });
    }

    const lead = await TrainingLead.create({ name, phone, city });
    res.status(201).json({ 
      message: 'Thank you for your interest. Our training team will contact you shortly.', 
      lead 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all training leads (with search, date filter, pagination)
// @route   GET /api/training/leads
// @access  Private (Admin)
const getLeads = async (req, res) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const totalLeads = await TrainingLead.countDocuments(query);
    const totalPages = Math.ceil(totalLeads / parseInt(limit));

    const leads = await TrainingLead.find(query)
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(parseInt(limit));

    res.json({
      leads,
      totalLeads,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitLead, getLeads };
