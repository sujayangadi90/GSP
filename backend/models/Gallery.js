const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  displayOrder: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
