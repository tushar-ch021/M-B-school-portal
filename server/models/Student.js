const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    serialNo: {
      type: String,
      unique: true,
      required: true
    },
    apaarId: {
      type: String,
      trim: true,
      default: ''
    },
    aadharNo: {
      type: String,
      trim: true,
      default: ''
    },
    panNumber: {
      type: String,
      trim: true,
      default: ''
    },
    nationality: {
      type: String,
      trim: true,
      default: 'Indian'
    },
    fatherQualification: {
      type: String,
      trim: true,
      default: ''
    },
    motherQualification: {
      type: String,
      trim: true,
      default: ''
    },
    officeAddress: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    siblings: {
      brother: {
        name: { type: String, trim: true, default: '' },
        class: { type: String, trim: true, default: '' },
        school: { type: String, trim: true, default: '' }
      },
      sister: {
        name: { type: String, trim: true, default: '' },
        class: { type: String, trim: true, default: '' },
        school: { type: String, trim: true, default: '' }
      }
    },
    photo: {
      url: {
        type: String,
        required: [true, 'Student photo is required']
      },
      thumbnailUrl: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      }
    },
    firstName: {
      type: String,
      required: [true, 'Please enter first name'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Please enter last name'],
      trim: true
    },
    dob: {
      type: Date,
      required: [true, 'Please enter date of birth']
    },
    gender: {
      type: String,
      required: [true, 'Please select gender'],
      enum: ['Male', 'Female', 'Other']
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: ''
    },
    class: {
      type: String,
      required: [true, 'Please enter class (e.g. 10th)'],
      trim: true
    },
    section: {
      type: String,
      required: [true, 'Please enter section (e.g. A)'],
      trim: true
    },
    rollNo: {
      type: String,
      trim: true,
      default: ''
    },
    academicYear: {
      type: String,
      required: [true, 'Please enter academic year (e.g. 2026-2027)'],
      trim: true
    },
    admissionDate: {
      type: Date,
      required: [true, 'Please enter admission date'],
      default: Date.now
    },
    fatherName: {
      type: String,
      required: [true, 'Please enter father name'],
      trim: true
    },
    fatherOccupation: {
      type: String,
      trim: true,
      default: ''
    },
    fatherPhone: {
      type: String,
      required: [true, 'Please enter father phone number'],
      trim: true
    },
    motherName: {
      type: String,
      required: [true, 'Please enter mother name'],
      trim: true
    },
    motherOccupation: {
      type: String,
      trim: true,
      default: ''
    },
    motherPhone: {
      type: String,
      trim: true,
      default: ''
    },
    guardianName: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      current: {
        type: String,
        required: [true, 'Please enter current address'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'Please enter city'],
        trim: true
      },
      state: {
        type: String,
        required: [true, 'Please enter state'],
        trim: true
      },
      pincode: {
        type: String,
        required: [true, 'Please enter pincode'],
        trim: true
      }
    },
    contactNo: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS'],
      default: 'General'
    },
    previousSchool: {
      name: { type: String, trim: true, default: '' },
      tcNo: { type: String, trim: true, default: '' }
    },
    usesTransport: {
      type: Boolean,
      default: false
    },
    transportRoute: {
      type: String,
      trim: true,
      default: ''
    },
    // Assigned Fee Structure (Single Source of Truth)
    tuitionFee: {
      type: Number,
      default: 0,
      min: [0, 'Tuition fee cannot be negative']
    },
    transportFee: {
      type: Number,
      default: 0,
      min: [0, 'Transport fee cannot be negative']
    },
    totalFee: {
      type: Number,
      default: 0,
      min: [0, 'Total fee cannot be negative']
    },
    // Transfer Certificate Details
    tcIssued: {
      type: Boolean,
      default: false
    },
    tcNumber: {
      type: String,
      default: ''
    },
    tcIssueDate: {
      type: Date
    },
    reasonForLeaving: {
      type: String,
      default: ''
    },
    lastClassAttended: {
      type: String,
      default: ''
    },
    conduct: {
      type: String,
      default: ''
    },
    duesCleared: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Soft-delete removal tracking
    isRemoved: {
      type: Boolean,
      default: false
    },
    removalReason: {
      type: String,
      default: ''
    },
    removedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure totalFee is computed atomically
// NOTE: This hook only fires on .save() calls, NOT on findByIdAndUpdate.
// When using findByIdAndUpdate, you must manually compute and set totalFee.
studentSchema.pre('save', function (next) {
  const tuition = Number(this.tuitionFee) || 0;
  const transport = this.usesTransport ? (Number(this.transportFee) || 0) : 0;
  this.totalFee = tuition + transport;
  next();
});

// Compound index to optimize queries that filter by status, class, and section
studentSchema.index({ isActive: 1, isRemoved: 1, class: 1, section: 1 });

// Query helpers/Virtuals if needed
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Student', studentSchema);
