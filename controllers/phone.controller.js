const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/phone/verify?phone= ─────────────────────────────────────────────
// Mirrors PhoneVerificationServiceImpl — proxies to AbstractAPI
const verifyPhone = asyncHandler(async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'phone query param is required',
    });
  }

  const apiKey = process.env.ABSTRACTAPI_PHONE_KEY;
  const apiUrl = process.env.ABSTRACTAPI_PHONE_URL;

  if (!apiKey || !apiUrl) {
    return res.status(500).json({
      error: 'CONFIG_ERROR',
      message: 'Phone verification service is not configured',
    });
  }

  const response = await axios.get(apiUrl, {
    params: { api_key: apiKey, phone },
  });

  // Return raw AbstractAPI response — same as Java's restTemplate.getForObject
  res.json(response.data);
});

module.exports = { verifyPhone };
