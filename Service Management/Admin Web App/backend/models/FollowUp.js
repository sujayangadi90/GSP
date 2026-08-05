const mongoose = require('mongoose');

const FollowUpSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
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
  }
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', FollowUpSchema);
