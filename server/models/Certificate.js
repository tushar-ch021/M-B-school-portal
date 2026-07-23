const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateNo: {
      type: String,
      unique: true,
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student link is required']
    },
    category: {
      type: String,
      required: [true, 'Certificate category is required'],
      enum: ['Sports', 'Annual', 'Competition', 'Academic Excellence', 'Character', 'Custom']
    },
    title: {
      type: String,
      required: [true, 'Certificate title is required'],
      trim: true
    },
    reasonText: {
      type: String,
      required: [true, 'Certificate description / achievement text is required'],
      trim: true
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Issued by admin reference is required']
    }
  },
  {
    timestamps: true
  }
);

certificateSchema.index({ student: 1, issueDate: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
