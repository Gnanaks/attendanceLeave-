const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'holiday', 'on-leave'],
      default: 'absent',
    },
    checkIn: { type: String },   // "HH:MM"
    checkOut: { type: String },  // "HH:MM"
    workingHours: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // teacher/manager or self
  },
  { timestamps: true }
);

// Unique attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
