const mongoose = require('mongoose');

const dealerCollectionSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['collected', 'pending'],
    default: 'collected'
  },
  paymentMode: {
    type: String,
    enum: [
      'Cash',
      'UPI',
      'Credit Card',
      'Debit Card',
      'Net Banking',
      'Bank Transfer / NEFT',
      'RTGS',
      'IMPS',
      'Cheque',
      'Demand Draft (DD)'
    ],
    required: true
  },
  referenceNumber: {
    type: String,
    default: ''
  },
  collectedAt: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

dealerCollectionSchema.index({ dealer: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('DealerCollection', dealerCollectionSchema);
