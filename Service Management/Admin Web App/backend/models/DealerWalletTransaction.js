const mongoose = require('mongoose');

const dealerWalletTransactionSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['charge', 'collection', 'adjustment'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueAmountAfter: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      enum: ['ticket_charge', 'dealer_payment', 'adjustment'],
      required: true
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
    },
    collectionRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DealerCollection'
    },
    paymentMode: {
      type: String,
      default: ''
    },
    referenceNumber: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    },
    createdByName: {
      type: String,
      default: 'System'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DealerWalletTransaction', dealerWalletTransactionSchema);
