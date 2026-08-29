const mongoose = require('mongoose');

const TimelineSchema = new mongoose.Schema({
  status: String,
  note: String,
  updatedBy: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const TicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['installation', 'service'],
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'assigned', 'in_progress', 'completed', 'verification_pending', 'closed', 'cancelled'],
    default: 'new'
  },
  customer: {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateMobile: String,
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  product: {
    category: { type: String, required: true },
    name: { type: String, required: true },
    modelNumber: String,
    serialNumber: String,
    purchaseDate: Date,
    invoiceNumber: String
  },
  serviceDetails: {
    description: String,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  },
  installationDetails: {
    preferredDate: String,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  },
  preferredVisitDate: String,
  remarks: String,
  invoiceImage: String,
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  source: {
    type: String,
    enum: ['admin', 'dealer', 'technician'],
    default: 'dealer'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignmentNotes: String,
  completion: {
    photos: [String],
    beforePhotos: [String],
    afterPhotos: [String],
    workDone: String,
    remarks: String,
    submittedAt: Date,
    usedParts: [{
      part: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
      quantity: { type: Number, required: true }
    }]
  },
  completionHistory: [{
    photos: [String],
    beforePhotos: [String],
    afterPhotos: [String],
    workDone: String,
    remarks: String,
    submittedAt: Date,
    usedParts: [{
      part: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
      quantity: { type: Number, required: true }
    }]
  }],
  adminVerification: {
    status: { type: String, enum: ['approved', 'rejected'] },
    reason: String,
    verifiedAt: Date
  },
  dealerExpense: {
    type: Number,
    min: 0
  },
  technicianEarning: {
    type: Number,
    min: 0
  },
  closingRemarks: String,
  closedAt: Date,
  timeline: [TimelineSchema]
}, { timestamps: true });

// Auto-increment ticket number logic on pre-save
TicketSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  
  try {
    const lastTicket = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNum = 1001;
    if (lastTicket && lastTicket.ticketNumber) {
      const match = lastTicket.ticketNumber.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    this.ticketNumber = `TKT-${nextNum}`;
    
    // Set initial timeline entry
    this.timeline.push({
      status: 'new',
      note: 'Ticket created',
      updatedBy: 'System'
    });
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
