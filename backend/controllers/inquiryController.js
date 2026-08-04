const Inquiry = require('../models/Inquiry');
const { sendLeadEmail } = require('../utils/mailer');

// @desc    Submit a new inquiry
// @route   POST /api/inquiries
// @access  Public
const submitInquiry = async (req, res) => {
  const { name, mobileNumber, emailAddress, serviceCategory, message } = req.body;

  try {
    if (!name || !mobileNumber || !message) {
      return res.status(400).json({ message: 'Name, Mobile Number, and Message are required' });
    }

    const inquiry = await Inquiry.create({
      name,
      mobileNumber,
      emailAddress: emailAddress || '',
      serviceCategory: serviceCategory || 'General Inquiry',
      message
    });

    // Send email alert asynchronously so the API response returns instantly
    sendLeadEmail({
      name,
      mobileNumber,
      emailAddress: emailAddress || '',
      serviceCategory: serviceCategory || 'General Inquiry',
      message
    });

    res.status(201).json({ message: 'Inquiry submitted successfully', inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all inquiries (with search, date filter, etc.)
// @route   GET /api/inquiries
// @access  Private (Admin)
const getInquiries = async (req, res) => {
  try {
    const { search, startDate, endDate, serviceCategory } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { emailAddress: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    if (serviceCategory) {
      query.serviceCategory = serviceCategory;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private (Admin)
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (inquiry) {
      await inquiry.deleteOne();
      res.json({ message: 'Inquiry removed' });
    } else {
      res.status(404).json({ message: 'Inquiry not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export inquiries in CSV format
// @route   GET /api/inquiries/export
// @access  Private (Admin)
const exportInquiries = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

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

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });

    // Generate CSV contents
    let csv = 'ID,Name,Mobile Number,Email,Service Category,Message,Status,Created At\n';
    inquiries.forEach((item) => {
      // Escape quotes in message/fields to keep CSV valid
      const name = `"${item.name.replace(/"/g, '""')}"`;
      const mobile = `"${item.mobileNumber.replace(/"/g, '""')}"`;
      const email = `"${(item.emailAddress || '').replace(/"/g, '""')}"`;
      const cat = `"${item.serviceCategory.replace(/"/g, '""')}"`;
      const msg = `"${item.message.replace(/"/g, '""')}"`;
      const date = `"${item.createdAt.toISOString()}"`;
      
      csv += `${item._id},${name},${mobile},${email},${cat},${msg},${item.status},${date}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('inquiries_export.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitInquiry, getInquiries, deleteInquiry, exportInquiries };
