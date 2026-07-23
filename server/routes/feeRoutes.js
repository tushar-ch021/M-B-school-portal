const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  collectFee, 
  getFeeHistoryByStudent, 
  updateStudentDues, 
  getStudentFeeSummary, 
  getDashboardStats,
  setMonthlyFeeConfig,
  getMonthlyFeeConfig,
  getClassMonthlyFeeOverview,
  getStudentMonthlyFees,
  collectMonthlyFeePayment,
  setIndividualStudentMonthlyFee
} = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

const collectFeeValidationRules = [
  body('studentId').notEmpty().withMessage('Student ID is required').isMongoId().withMessage('Invalid student database key'),
  body('academicYear').notEmpty().withMessage('Academic year is required').trim(),
  body('paymentMode').isIn(['Cash', 'Cheque', 'DD', 'Online', 'UPI']).withMessage('Invalid payment mode option'),
  body('feeItems').isArray({ min: 1 }).withMessage('At least one fee item must be specified'),
  body('feeItems.*.particular').notEmpty().withMessage('Particular title is required').trim(),
  body('feeItems.*.dues').isNumeric().withMessage('Dues must be numeric').toFloat(),
  body('feeItems.*.received').isNumeric().withMessage('Received amount must be numeric').toFloat()
];

// Fee collection entry
router.post('/collect', protect, collectFeeValidationRules, validateFields, collectFee);

// Student ledger logs
router.get('/student/:studentId', protect, getFeeHistoryByStudent);

// Student single source of truth fee summary
router.get('/student/:studentId/summary', protect, getStudentFeeSummary);

// Update student total fee / dues structure
router.put('/student/:studentId/update-dues', protect, updateStudentDues);

// Dashboard aggregate statistics
router.get('/dashboard-stats', protect, getDashboardStats);

// Monthly Fee Tracking Routes (Feature 5)
router.post(
  '/monthly/config',
  protect,
  [
    body('className').notEmpty().withMessage('Class name is required'),
    body('month').notEmpty().withMessage('Month is required'),
    body('monthIndex').isInt({ min: 1, max: 12 }).withMessage('Month index must be 1-12'),
    body('year').isNumeric().withMessage('Year must be numeric'),
    body('amountDue').isNumeric().withMessage('Fee amount must be a non-negative number'),
    validateFields
  ],
  setMonthlyFeeConfig
);

router.get('/monthly/config', protect, getMonthlyFeeConfig);
router.get('/monthly/class', protect, getClassMonthlyFeeOverview);
router.get('/monthly/student/:studentId', protect, getStudentMonthlyFees);

router.put(
  '/monthly/student-fee',
  protect,
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('month').notEmpty().withMessage('Month is required'),
    body('year').isNumeric().withMessage('Year is required'),
    body('amountDue').isNumeric().withMessage('Fee amount must be a non-negative number'),
    validateFields
  ],
  setIndividualStudentMonthlyFee
);

router.post(
  '/monthly/payment',
  protect,
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('month').notEmpty().withMessage('Month is required'),
    body('year').isNumeric().withMessage('Year is required'),
    body('amount').isNumeric().withMessage('Payment amount must be a positive number'),
    validateFields
  ],
  collectMonthlyFeePayment
);

module.exports = router;
