const mongoose = require('mongoose');

const DealerVideoSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monthYear: {
    type: String, // format: "YYYY-MM", e.g. "2026-08"
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  videoUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedByName: {
    type: String,
    default: 'Admin'
  }
}, { timestamps: true });

DealerVideoSchema.index({ dealer: 1, monthYear: 1 });

module.exports = mongoose.model('DealerVideo', DealerVideoSchema);
