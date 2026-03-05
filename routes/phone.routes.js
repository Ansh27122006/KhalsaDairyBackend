const express = require('express');
const { verifyPhone } = require('../controllers/phone.controller');

const router = express.Router();

// GET /api/phone/verify?phone=
// No auth guard — same as Java PhoneController (no @PreAuthorize)
router.get('/verify', verifyPhone);

module.exports = router;
