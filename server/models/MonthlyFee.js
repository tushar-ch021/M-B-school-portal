const mongoose = require('mongoose');

const monthlyFeeSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      required: [true, 'Class is required'],
      trim: true
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      trim: true
    },
    monthIndex: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: [true, 'Year is required']
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true
    },
    amountDue: {
      type: Number,
      required: [true, 'Monthly fee amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    configuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index per class, month, and year
monthlyFeeSchema.index({ class: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyFee', monthlyFeeSchema);
