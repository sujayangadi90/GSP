const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
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

module.exports = mongoose.model('Banner', bannerSchema);
