const mongoose = require('mongoose');

const FollowUpSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: false
  },
  amc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amc',
    required: false
  },
  category: {
    type: String,
    enum: ['service', 'amc'],
    default: 'service'
  },
  dueAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'closed'],
    default: 'new'
  },
  closedAt: {
    type: Date
  },
  notes: [{
    text: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', FollowUpSchema);
