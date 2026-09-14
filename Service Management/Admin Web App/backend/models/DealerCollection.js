const mongoose = require('mongoose');

const dealerCollectionSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number
  },
  year: {
    type: Number
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

dealerCollectionSchema.index({ dealer: 1, createdAt: -1 });

module.exports = mongoose.model('DealerCollection', dealerCollectionSchema);
