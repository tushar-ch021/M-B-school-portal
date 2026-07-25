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
  },
  tuitionFee: { type: Number, default: 0 },
  transportFee: { type: Number, default: 0 },
  otherFee: { type: Number, default: 0 },
  otherFeeType: { type: String, default: '' },
  carriedForwardFrom: {
    month: { type: String, default: '' },
    year: { type: Number },
    amount: { type: Number, default: 0 }
  },
  carriedNote: { type: String, default: '' },
  tuitionPaid: { type: Number, default: 0 },
  transportPaid: { type: Number, default: 0 },
  otherPaid: { type: Number, default: 0 },
  carriedPaid: { type: Number, default: 0 }
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
    tuitionFee: {
      type: Number,
      default: 0
    },
    transportFee: {
      type: Number,
      default: 0
    },
    otherFee: {
      type: Number,
      default: 0
    },
    otherFeeType: {
      type: String,
      default: ''
    },
    amountPaid: {
      type: Number,
      required: true,
      min: [0, 'Amount paid cannot be negative'],
      default: 0
    },
    payments: [feePaymentSubSchema],
    carriedForwardTo: {
      month: { type: String, default: '' },
      year: { type: Number },
      amount: { type: Number, default: 0 },
      carriedAt: { type: Date }
    },
    carriedForwardFrom: {
      month: { type: String, default: '' },
      year: { type: Number },
      amount: { type: Number, default: 0 }
    }
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

  if (due === 0) return 'Paid';
  if (paid === 0) return 'Due';
  if (paid >= due) return 'Paid';
  return 'Partial';
});

// Compound unique index to prevent duplicate monthly fee records for a student
feeRecordSchema.index(
  { student: 1, academicYear: 1, monthIndex: 1 },
  { unique: true }
);

feeRecordSchema.index({ class: 1, academicYear: 1, monthIndex: 1 });

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
