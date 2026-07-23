const { validationResult } = require('express-validator');

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => `${err.path}: ${err.msg}`);
    console.error('Validation Failure Details:', errorDetails);
    return res.status(400).json({
      message: errorDetails.join(' | '),
      errors: errorDetails
    });
  }
  next();
};

module.exports = { validateFields };
