const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  admitStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  removeStudent,
  getRemovedStudents,
  restoreStudent
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

// Custom parser to transform stringified JSON properties in multipart forms
const parseMultipartJson = (req, res, next) => {
  if (req.body.address && typeof req.body.address === 'string') {
    try {
      req.body.address = JSON.parse(req.body.address);
    } catch (e) {
      console.warn('Address property failed to parse as JSON string.');
    }
  }
  if (req.body.previousSchool && typeof req.body.previousSchool === 'string') {
    try {
      req.body.previousSchool = JSON.parse(req.body.previousSchool);
    } catch (e) { }
  }
  if (req.body.siblings && typeof req.body.siblings === 'string') {
    try {
      req.body.siblings = JSON.parse(req.body.siblings);
    } catch (e) { }
  }
  next();
};

const studentValidationRules = [
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('dob').notEmpty().withMessage('Date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female or Other'),
  body('class').notEmpty().withMessage('Class is required').trim(),
  body('section').notEmpty().withMessage('Section is required').trim(),
  body('academicYear').notEmpty().withMessage('Academic year is required').trim(),
  body('fatherName').notEmpty().withMessage('Father name is required').trim(),
  body('fatherPhone').notEmpty().withMessage('Father phone is required').trim(),
  body('motherName').notEmpty().withMessage('Mother name is required').trim(),

  // Optional field validators
  body('rollNo').optional({ checkFalsy: true }).trim(),
  body('panNumber').optional({ checkFalsy: true }).trim(),
  body('contactNo').optional({ checkFalsy: true }),
  body('apaarId')
    .optional({ checkFalsy: true })
    .isLength({ min: 12, max: 12 }).withMessage('APAAR ID must be exactly 12 digits')
    .isNumeric().withMessage('APAAR ID must contain numbers only'),

  body('address.current').notEmpty().withMessage('Current address is required').trim(),
  body('address.city').notEmpty().withMessage('City is required').trim(),
  body('address.state').notEmpty().withMessage('State is required').trim(),
  body('address.pincode').notEmpty().withMessage('Pincode is required').trim()
];

// Student Index and Admission
router.route('/')
  .post(
    protect,
    upload.single('photo'),
    parseMultipartJson,
    studentValidationRules,
    validateFields,
    admitStudent
  )
  .get(protect, getStudents);

// Removed students listing (must be BEFORE /:id to avoid param collision)
router.get('/removed', protect, getRemovedStudents);

// Student Detail operations
router.route('/:id')
  .get(protect, getStudentById)
  .put(
    protect,
    upload.single('photo'),
    parseMultipartJson,
    // validation rules can be optional/relaxed on PUT or same
    studentValidationRules,
    validateFields,
    updateStudent
  )
  .delete(protect, deleteStudent);

// Soft-remove and restore operations
router.put('/:id/remove', protect, removeStudent);
router.put('/:id/restore', protect, restoreStudent);

module.exports = router;
