const express = require('express');
const router = express.Router();
const { getBrandingConfig } = require('../controllers/configController');

router.get('/branding', getBrandingConfig);

module.exports = router;
