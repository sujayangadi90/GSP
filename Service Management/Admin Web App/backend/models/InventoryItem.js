const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['stock_in', 'stock_out', 'ticket_use'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  ticketNumber: {
    type: String
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  technicianName: {
    type: String
  }
});

const InventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    default: 5
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  transactions: [TransactionSchema]
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
