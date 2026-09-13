const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      enum: ['ticket_earning', 'payout', 'adjustment'],
      required: true
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
    },
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout'
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

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
