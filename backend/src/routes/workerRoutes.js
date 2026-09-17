const express = require('express');
const router = express.Router();
const {
  getAssignedIssues,
  updateWorkProgress,
  uploadCompletionEvidence,
  getAllWorkers,
  addWorker,
  updateWorker,
  toggleWorkerStatus,
  resetWorkerPassword,
  getWorkerMonitoringActivity,
  getWorkerDashboard,
} = require('../controllers/workerController');
const {
  getMyTasks,
  acceptTask,
  startTask,
  updateProgress,
  completeTask,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Worker specific operations
router.get('/tasks', protect, authorize('worker', 'admin'), getMyTasks);
router.get('/my-tasks', protect, authorize('worker', 'admin'), getMyTasks);
router.get('/dashboard', protect, authorize('worker', 'admin'), getWorkerDashboard);
router.get('/assigned', protect, authorize('worker', 'admin'), getAssignedIssues);
router.put('/tasks/:id/accept', protect, authorize('worker', 'admin'), acceptTask);
router.put('/tasks/:id/start', protect, authorize('worker', 'admin'), startTask);
router.put('/tasks/:id/progress', protect, authorize('worker', 'admin'), upload.array('images', 3), updateProgress);
router.post('/tasks/:id/complete', protect, authorize('worker', 'admin'), upload.array('images', 5), completeTask);
router.put('/issues/:id/progress', protect, authorize('worker', 'admin'), upload.array('images', 3), updateWorkProgress);
router.post('/issues/:id/completion-evidence', protect, authorize('worker', 'admin'), upload.array('images', 5), uploadCompletionEvidence);

// Admin worker monitoring & analytics
router.get('/stats/activity', protect, authorize('admin'), getWorkerMonitoringActivity);

// Admin worker management
router
  .route('/')
  .get(protect, authorize('admin'), getAllWorkers)
  .post(protect, authorize('admin'), addWorker);

router.put('/:id', protect, authorize('admin'), updateWorker);
router.put('/:id/toggle', protect, authorize('admin'), toggleWorkerStatus);
router.post('/:id/reset-password', protect, authorize('admin'), resetWorkerPassword);

module.exports = router;
