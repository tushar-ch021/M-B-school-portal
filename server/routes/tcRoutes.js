const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { issueTC, getTCRecords, getTCDetails } = require('../controllers/tcController');
const { protect } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

const tcValidationRules = [
  body('reasonForLeaving').notEmpty().withMessage('Reason for leaving is required').trim(),
  body('lastClassAttended').notEmpty().withMessage('Last class attended is required').trim(),
  body('conduct').notEmpty().withMessage('Conduct appraisal is required').trim(),
  body('duesCleared').isBoolean().withMessage('Dues clearance status must be boolean')
];

// Issue TC
router.post('/issue/:studentId', protect, tcValidationRules, validateFields, issueTC);

// Log of all issued TCs
router.get('/records', protect, getTCRecords);

// Single TC details
router.get('/:studentId', protect, getTCDetails);

module.exports = router;
