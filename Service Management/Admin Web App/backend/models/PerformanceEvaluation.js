const mongoose = require('mongoose');

const AreaRatingSchema = new mongoose.Schema({
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PerformanceArea'
  },
  areaName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  comments: {
    type: String,
    default: ''
  }
});

const PerformanceEvaluationSchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technicianName: {
    type: String,
    required: true
  },
  technicianCode: {
    type: String,
    default: ''
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  ratings: [AreaRatingSchema],
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  performanceBand: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
    default: 'Average'
  },
  status: {
    type: String,
    enum: ['draft', 'finalized'],
    default: 'draft'
  },
  remarks: {
    type: String,
    default: ''
  },
  evaluatedBy: {
    type: String,
    required: true
  },
  evaluatedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedAt: {
    type: Date
  },
  finalizedBy: {
    type: String
  }
}, { timestamps: true });

// Ensure one evaluation per technician per month/year
PerformanceEvaluationSchema.index({ technician: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('PerformanceEvaluation', PerformanceEvaluationSchema);
