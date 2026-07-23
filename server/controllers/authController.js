const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');

/**
 * Generates JWT token for the authenticated admin
 * @param {string} id Admin MongoDB ObjectId
 * @returns {string} Signed JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token expires in 30 days
  });
};

// @desc    Auth Admin & Get Token
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const cleanEmail = email.trim().toLowerCase();
  let admin = await Admin.findOne({ email: cleanEmail });

  if (!admin) {
    admin = await Admin.findOne({ email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  }

  if (!admin) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password.trim(), admin.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.status(200).json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    signatureUrl: admin.signatureUrl || '',
    token: generateToken(admin._id)
  });
});

// @desc    Get Admin profile (verify active login status)
// @route   GET /api/auth/profile
// @access  Private
const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('-password');
  if (admin) {
    res.status(200).json(admin);
  } else {
    res.status(404);
    throw new Error('Admin not found');
  }
});

// @desc    Upload Principal Signature
// @route   PUT /api/auth/signature
// @access  Private
const uploadSignature = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please select a signature image file to upload.');
  }

  const { uploadAndOptimize } = require('../utils/cloudinaryUpload');

  // Upload to branding folder without face cropping
  const uploadResult = await uploadAndOptimize(req.file.buffer, {
    folder: 'br-school/branding',
    isStudentPhoto: false
  });

  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  admin.signatureUrl = uploadResult.url;
  await admin.save();

  res.status(200).json({
    message: 'Principal signature uploaded successfully',
    signatureUrl: admin.signatureUrl
  });
});

// @desc    Delete Principal Signature
// @route   DELETE /api/auth/signature
// @access  Private
const deleteSignature = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  // Clean up the old signature image from Cloudinary to prevent orphaned assets
  if (admin.signatureUrl) {
    try {
      const parts = admin.signatureUrl.split('/upload/');
      if (parts.length === 2) {
        // Extract public_id by removing file extension from the path segment
        const pathParts = parts[1].split('/');
        // Remove version prefix (v1234567890) if present
        const startIndex = pathParts[0].match(/^v\d+$/) ? 1 : 0;
        const publicIdWithExt = pathParts.slice(startIndex).join('/');
        const publicId = publicIdWithExt.replace(/\.[^.]+$/, '');
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up old signature from Cloudinary:', cleanupErr);
    }
  }

  admin.signatureUrl = '';
  await admin.save();

  res.status(200).json({
    message: 'Principal signature removed successfully',
    signatureUrl: ''
  });
});

module.exports = {
  loginAdmin,
  getAdminProfile,
  uploadSignature,
  deleteSignature
};
