const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, 'Please provide a worker ID'],
    },
    date: {
      type: String,
      required: [true, 'Please provide a date in YYYY-MM-DD format'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Please use YYYY-MM-DD format for date'],
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'late', 'leave'],
        message: '{VALUE} is not a valid status. Choose present, absent, late, or leave',
      },
      required: [true, 'Please provide a status (present, absent, late)'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide the user who marked this attendance'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound unique index to prevent duplicate records for a worker on a single day
attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
