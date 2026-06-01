const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  associatedServices: [{
    type: String // List of service names or categories
  }]
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
