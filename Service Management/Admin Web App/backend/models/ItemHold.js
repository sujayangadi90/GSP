const mongoose = require('mongoose');

const ItemHoldSchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technicianName: {
    type: String,
    required: true
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantityHeld: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

ItemHoldSchema.index({ technician: 1, inventoryItem: 1 }, { unique: true });

module.exports = mongoose.model('ItemHold', ItemHoldSchema);
