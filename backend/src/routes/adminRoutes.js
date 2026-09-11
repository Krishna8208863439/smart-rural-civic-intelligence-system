const express = require('express');
const router = express.Router();
const { getDashboardKPIs } = require('../controllers/analyticsController');
const { getIssues, assignWorker } = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('admin'), getDashboardKPIs);
router.get('/issues', protect, authorize('admin'), getIssues);
router.put('/assign-worker/:id', protect, authorize('admin'), assignWorker);

module.exports = router;
