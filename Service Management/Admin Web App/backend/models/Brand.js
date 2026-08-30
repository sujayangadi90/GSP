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
  },
  // 1. Customer Fees
  customerServiceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  customerInstallationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  // 2. Dealer Fees
  dealerServiceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  dealerInstallationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  // 3. Technician Fees
  technicianServiceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  technicianInstallationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  // Legacy fields kept for backward compatibility
  serviceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  installationFee: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Avoid duplicate brand names for the same appliance
BrandSchema.index({ name: 1, appliance: 1 }, { unique: true });

module.exports = mongoose.model('Brand', BrandSchema);
