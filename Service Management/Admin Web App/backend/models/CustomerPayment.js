const mongoose = require('mongoose');

const customerPaymentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
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
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomerPayment', customerPaymentSchema);
