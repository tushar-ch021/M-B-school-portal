import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;
const apaarRegex = /^\d{12}$/;

// Student Admission Form validation rules
export const admissionSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: 'Please select a gender' }) }),
  bloodGroup: z.string().optional(),

  class: z.string().min(1, 'Class is required').trim(),
  section: z.string().min(1, 'Section is required').max(5, 'Section is too long').toUpperCase().trim(),
  rollNo: z.string().optional(),
  panNumber: z.string().optional(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY').trim(),
  admissionDate: z.string().min(1, 'Admission date is required'),

  fatherName: z.string().min(2, 'Father name must be at least 2 characters').trim(),
  fatherOccupation: z.string().optional(),
  fatherPhone: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile number'),

  motherName: z.string().min(2, 'Mother name must be at least 2 characters').trim(),
  motherOccupation: z.string().optional(),
  motherPhone: z.string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Enter a valid 10-digit mobile number'
    }),

  guardianName: z.string().optional(),

  address: z.object({
    current: z.string().min(5, 'Current address must be at least 5 characters').trim(),
    city: z.string().min(2, 'City is required').trim(),
    state: z.string().min(2, 'State is required').trim(),
    pincode: z.string().regex(pincodeRegex, 'Enter a valid 6-digit PIN code')
  }),

  contactNo: z.string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Enter a valid 10-digit contact number'
    }),
  category: z.enum(['General', 'OBC', 'SC', 'ST', 'EWS'], { errorMap: () => ({ message: 'Please select a category' }) }),

  previousSchool: z.object({
    name: z.string().optional(),
    tcNo: z.string().optional()
  }).optional(),

  usesTransport: z.boolean().default(false),
  transportRoute: z.string().optional(),

  apaarId: z.string()
    .optional()
    .refine((val) => !val || apaarRegex.test(val), {
      message: 'APAAR ID must be exactly 12 digits'
    }),
  aadharNo: z.string()
    .optional()
    .refine((val) => !val || apaarRegex.test(val), {
      message: 'Aadhar Number must be exactly 12 digits'
    }),
  nationality: z.string().default('Indian'),
  fatherQualification: z.string().optional(),
  motherQualification: z.string().optional(),
  officeAddress: z.string().optional(),
  email: z.string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Enter a valid email address'
    }),
  siblings: z.object({
    brother: z.object({
      name: z.string().optional(),
      class: z.string().optional(),
      school: z.string().optional()
    }).optional(),
    sister: z.object({
      name: z.string().optional(),
      class: z.string().optional(),
      school: z.string().optional()
    }).optional()
  }).optional()
}).refine((data) => {
  // If usesTransport is enabled, transportRoute is required
  if (data.usesTransport && (!data.transportRoute || data.transportRoute.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Transport route is required when school transport is enabled',
  path: ['transportRoute']
});

// Fee Collection Form validation rules
export const feeCollectionSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required'),
  paymentMode: z.enum(['Cash', 'Cheque', 'DD', 'Online', 'UPI'], {
    errorMap: () => ({ message: 'Please select a payment mode' })
  }),
  payableAt: z.string().optional(),
  remark: z.string().optional(),
  bankDetails: z.object({
    bank: z.string().optional(),
    chequeNo: z.string().optional(),
    chequeDate: z.string().optional()
  }).optional()
}).refine((data) => {
  if (data.paymentMode === 'Cheque' || data.paymentMode === 'DD') {
    return !!data.bankDetails?.bank && !!data.bankDetails?.chequeNo && !!data.bankDetails?.chequeDate;
  }
  return true;
}, {
  message: 'Bank, check number, and date are required for Cheque/DD payments',
  path: ['bankDetails']
});
