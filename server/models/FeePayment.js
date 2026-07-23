const mongoose = require('mongoose');

const feeItemSchema = new mongoose.Schema({
  particular: {
    type: String,
    required: [true, 'Please specify fee item description (e.g. Tuition Fee, Transport Fee)'],
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  dues: {
    type: Number,
    required: [true, 'Dues amount is required'],
    min: [0, 'Dues cannot be negative']
  },
  received: {
    type: Number,
    required: [true, 'Received amount is required'],
    min: [0, 'Received cannot be negative']
  },
  balance: {
    type: Number,
    required: [true, 'Balance amount is required']
  }
});

const feePaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student link is required']
    },
    receiptNo: {
      type: String,
      unique: true,
      required: true
    },
    receiptDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required']
    },
    feeItems: [feeItemSchema],
    totalDues: {
      type: Number,
      required: true
    },
    totalReceived: {
      type: Number,
      required: true
    },
    totalBalance: {
      type: Number,
      required: true
    },
    paymentMode: {
      type: String,
      required: [true, 'Please select payment mode'],
      enum: ['Cash', 'Cheque', 'DD', 'Online', 'UPI']
    },
    bankDetails: {
      bank: { type: String, trim: true, default: '' },
      chequeNo: { type: String, trim: true, default: '' },
      chequeDate: { type: Date }
    },
    payableAt: {
      type: String,
      trim: true,
      default: ''
    },
    remark: {
      type: String,
      trim: true,
      default: ''
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Collected by Admin is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound index to optimize single-student ledger lookups with receipt date sorting
feePaymentSchema.index({ student: 1, receiptDate: -1 });

// Single index to optimize dashboard monthly stats aggregations filtering by date
feePaymentSchema.index({ receiptDate: 1 });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
