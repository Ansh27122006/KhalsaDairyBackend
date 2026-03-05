const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const { getDashboardStats, getSalesReport } = require('../controllers/analytics.controller');

const router = express.Router();

// Analytics is admin-only — regular customers have no business here
router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);

module.exports = router;
