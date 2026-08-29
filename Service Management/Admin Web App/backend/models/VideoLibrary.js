const mongoose = require('mongoose');

const VideoLibrarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance',
    required: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  videoUrl: {
    type: String, // Can be YouTube, Vimeo, direct mp4 link or uploaded path
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('VideoLibrary', VideoLibrarySchema);
