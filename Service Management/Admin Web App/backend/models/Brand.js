const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance',
    required: true
  },
  followUpDays: {
    type: Number,
    required: true,
    default: 90,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'Follow-up days must be a positive integer.'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Avoid duplicate brand names for the same appliance
BrandSchema.index({ name: 1, appliance: 1 }, { unique: true });

module.exports = mongoose.model('Brand', BrandSchema);
