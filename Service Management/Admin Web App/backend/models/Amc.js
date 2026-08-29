const mongoose = require('mongoose');

const AmcSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  amcType: {
    type: String,
    enum: ['service_only', 'part_service'],
    required: true
  },
  amcAmount: {
    type: Number,
    required: true
  },
  visitsIncluded: {
    type: Number,
    required: true
  },
  visitsUsed: {
    type: Number,
    default: 0
  },
  includedServices: {
    type: String
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'expired', 'cancelled'],
    default: 'upcoming'
  }
}, { timestamps: true });

module.exports = mongoose.model('Amc', AmcSchema);
