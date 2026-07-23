const asyncHandler = require('../utils/asyncHandler');

// @desc    Get centralized school branding and configuration
// @route   GET /api/config/branding
// @access  Public
const getBrandingConfig = asyncHandler(async (req, res) => {
  const schoolName = (process.env.SCHOOL_NAME || 'M.B. Public School').trim();
  const schoolCode = (process.env.SCHOOL_CODE || 'MBPS').trim();
  const rawAddress = (process.env.SCHOOL_ADDRESS || 'Kisoli, Bulandshahr, Uttar Pradesh').trim();
  const schoolAddress = rawAddress.replace(/,([^\s])/g, ', $1');
  const schoolPhone1 = (process.env.SCHOOL_PHONE_1 || '8171716781').trim();
  const schoolPhone2 = (process.env.SCHOOL_PHONE_2 || '7819053105').trim();

  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).json({
    success: true,
    data: {
      schoolName,
      schoolCode,
      schoolAddress,
      schoolPhone1,
      schoolPhone2
    }
  });
});

module.exports = {
  getBrandingConfig
};
