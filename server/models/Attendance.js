const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['student', 'staff'],
      default: 'student',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: function () {
        return this.type === 'student';
      }
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: function () {
        return this.type === 'staff';
      }
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave'],
      required: [true, 'Attendance status is required']
    },
    class: {
      type: String,
      trim: true,
      required: function () {
        return this.type === 'student';
      }
    },
    section: {
      type: String,
      trim: true,
      required: function () {
        return this.type === 'student';
      }
    },
    remark: {
      type: String,
      trim: true,
      default: ''
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Marked by administrator reference is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique indexes to prevent duplicate attendance records on the same day
attendanceSchema.index(
  { type: 1, student: 1, date: 1 },
  { unique: true, partialFilterExpression: { type: 'student', student: { $exists: true } } }
);

attendanceSchema.index(
  { type: 1, staff: 1, date: 1 },
  { unique: true, partialFilterExpression: { type: 'staff', staff: { $exists: true } } }
);

// Compound query index for fetching class-wise attendance for a given date
attendanceSchema.index({ type: 1, class: 1, section: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
