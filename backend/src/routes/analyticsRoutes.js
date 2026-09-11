const express = require('express');
const router = express.Router();
const { getDashboardKPIs } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardKPIs);

module.exports = router;
