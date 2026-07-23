const mongoose = require('mongoose');

const MONTH_NAMES = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
];

const feePaymentSubSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'DD', 'Online', 'UPI'],
    default: 'Cash'
  },
  receiptNo: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  remark: {
    type: String,
    default: ''
  }
});

const feeRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student link is required']
    },
    class: {
      type: String,
      default: ''
    },
    section: {
      type: String,
      default: ''
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required']
    },
    month: {
      type: String,
      required: true,
      enum: MONTH_NAMES
    },
    monthIndex: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    isConfigured: {
      type: Boolean,
      default: true
    },
    amountDue: {
      type: Number,
      required: true,
      min: [0, 'Amount due cannot be negative'],
      default: 0
    },
    amountPaid: {
      type: Number,
      required: true,
      min: [0, 'Amount paid cannot be negative'],
      default: 0
    },
    payments: [feePaymentSubSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for derived status (Not Set | Due | Partial | Paid)
feeRecordSchema.virtual('status').get(function () {
  if (this.isConfigured === false || this.amountDue === null || this.amountDue === undefined) {
    return 'Not Set';
  }
  const paid = Number(this.amountPaid) || 0;
  const due = Number(this.amountDue) || 0;

  if (due === 0 && paid === 0) return 'Not Set';
  if (paid === 0) return 'Due';
  if (paid >= due && due > 0) return 'Paid';
  return 'Partial';
});

// Compound unique index to prevent duplicate monthly fee records for a student
feeRecordSchema.index(
  { student: 1, academicYear: 1, monthIndex: 1 },
  { unique: true }
);

feeRecordSchema.index({ class: 1, academicYear: 1, monthIndex: 1 });

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
