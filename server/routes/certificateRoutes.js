const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createCertificate,
  getCertificates,
  getCertificateById,
  deleteCertificate
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

router.use(protect);

router.post(
  '/',
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('category')
      .isIn(['Sports', 'Annual', 'Competition', 'Academic Excellence', 'Character', 'Custom'])
      .withMessage('Valid certificate category is required'),
    body('title').notEmpty().withMessage('Certificate title is required').trim(),
    body('reasonText').notEmpty().withMessage('Certificate reason text is required').trim(),
    validateFields
  ],
  createCertificate
);

router.get('/', getCertificates);
router.get('/:id', getCertificateById);
router.delete('/:id', deleteCertificate);

module.exports = router;
