const express = require('express');
const router = express.Router();
const {
  getAssignedIssues,
  updateWorkProgress,
  uploadCompletionEvidence,
  getAllWorkers,
  addWorker,
  toggleWorkerStatus,
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Worker specific operations
router.get('/assigned', protect, authorize('worker', 'admin'), getAssignedIssues);
router.put('/issues/:id/progress', protect, authorize('worker', 'admin'), upload.array('images', 3), updateWorkProgress);
router.post('/issues/:id/completion-evidence', protect, authorize('worker', 'admin'), upload.array('images', 5), uploadCompletionEvidence);

// Admin worker management
router
  .route('/')
  .get(protect, authorize('admin'), getAllWorkers)
  .post(protect, authorize('admin'), addWorker);

router.put('/:id/toggle', protect, authorize('admin'), toggleWorkerStatus);

module.exports = router;
