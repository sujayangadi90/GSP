const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  serviceCategory: {
    type: String,
    default: 'General Inquiry'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Resolved'],
    default: 'New'
  }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
