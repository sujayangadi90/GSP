const mongoose = require("mongoose");

const AttendanceCorrectionSchema = new mongoose.Schema({
  correctedBy: {
    type: String,
    required: true
  },
  correctedAt: {
    type: Date,
    default: Date.now
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed
  },
  newData: {
    type: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String,
    required: true
  }
});

const AttendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true // YYYY-MM-DD
  },
  clockInTime: {
    type: Date,
    required: true
  },
  clockInLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: "" }
  },
  clockInSelfie: {
    type: String,
    required: true
  },
  clockOutTime: {
    type: Date
  },
  clockOutLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, default: "" }
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["clocked_in", "completed", "missing_clock_out", "corrected"],
    default: "clocked_in"
  },
  isCorrected: {
    type: Boolean,
    default: false
  },
  corrections: [AttendanceCorrectionSchema]
}, { timestamps: true });

// Ensure one record per employee per date
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ employee: 1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);
