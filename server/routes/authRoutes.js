const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminProfile, uploadSignature, deleteSignature } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public login route
router.post('/login', loginAdmin);

// Private self-profile checks
router.get('/profile', protect, getAdminProfile);

// Signature endpoints
router.put('/signature', protect, upload.single('signature'), uploadSignature);
router.delete('/signature', protect, deleteSignature);

module.exports = router;
