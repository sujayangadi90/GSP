const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    technician: {
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
      enum: ['paid', 'unpaid'],
      default: 'unpaid'
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
      ]
    },
    referenceNumber: {
      type: String,
      default: ''
    },
    paidAt: {
      type: Date
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure 1 payout record per technician per month/year
payoutSchema.index({ technician: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payout', payoutSchema);
