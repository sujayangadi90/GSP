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

// Index to optimize payout queries per technician per month/year (non-unique to allow multiple disbursements/anytime payouts)
payoutSchema.index({ technician: 1, month: 1, year: 1 });

const Payout = mongoose.model('Payout', payoutSchema);

// Drop legacy unique index if it exists in MongoDB
Payout.collection.dropIndex('technician_1_month_1_year_1').catch(() => {
  // Index might not exist or already dropped, ignore error
});

module.exports = Payout;
