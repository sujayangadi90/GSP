const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  shortDescription: {
    type: String,
    required: true
  },
  detailedDescription: {
    type: String,
    default: ''
  },
  features: [{
    type: String
  }],
  benefits: [{
    type: String
  }],
  serviceTypes: [{
    type: String  // e.g. "Installation", "Repair", "Maintenance"
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metaTitle: {
    type: String,
    default: ''
  },
  metaDescription: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
