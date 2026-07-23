const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const {
  markStudentAttendanceBulk,
  getClassAttendanceByDate,
  getStudentAttendanceHistory,
  markStaffAttendanceBulk,
  getStaffAttendanceByDate,
  addStaffMember,
  getMonthWiseAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

// All attendance routes require admin authentication
router.use(protect);

// Month-wise Attendance Route (Student or Staff)
router.get('/monthly', getMonthWiseAttendance);

// Student Attendance Routes
router.post(
  '/student/bulk',
  [
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Valid date format is required'),
    body('class').notEmpty().withMessage('Class is required').trim(),
    body('section').notEmpty().withMessage('Section is required').trim(),
    body('records').isArray({ min: 1 }).withMessage('Records must be a non-empty array'),
    body('records.*.studentId').notEmpty().withMessage('Student ID is required for each record'),
    body('records.*.status').isIn(['Present', 'Absent', 'Leave']).withMessage('Status must be Present, Absent or Leave'),
    validateFields
  ],
  markStudentAttendanceBulk
);

router.get(
  '/student/class',
  [
    query('class').notEmpty().withMessage('Class parameter is required').trim(),
    query('section').notEmpty().withMessage('Section parameter is required').trim(),
    query('date').notEmpty().withMessage('Date parameter is required').isISO8601().withMessage('Valid date format is required'),
    validateFields
  ],
  getClassAttendanceByDate
);

router.get('/student/:studentId/history', getStudentAttendanceHistory);

// Staff Attendance Routes (Feature 2)
router.post(
  '/staff/bulk',
  [
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Valid date format is required'),
    body('records').isArray({ min: 1 }).withMessage('Records must be a non-empty array'),
    body('records.*.staffId').notEmpty().withMessage('Staff ID is required for each record'),
    body('records.*.status').isIn(['Present', 'Absent', 'Leave']).withMessage('Status must be Present, Absent or Leave'),
    validateFields
  ],
  markStaffAttendanceBulk
);

router.get(
  '/staff',
  [
    query('date').notEmpty().withMessage('Date parameter is required').isISO8601().withMessage('Valid date format is required'),
    validateFields
  ],
  getStaffAttendanceByDate
);

router.post(
  '/staff',
  [
    body('name').notEmpty().withMessage('Staff name is required').trim(),
    validateFields
  ],
  addStaffMember
);

module.exports = router;
