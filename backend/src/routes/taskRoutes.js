const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getMyTasks,
  acceptTask,
  startTask,
  updateProgress,
  completeTask,
  verifyTask,
  reopenTask,
  reassignTask,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Worker specific routes
router.get('/my', protect, authorize('worker'), getMyTasks);
router.put('/:id/accept', protect, authorize('worker'), acceptTask);
router.put('/:id/start', protect, authorize('worker'), startTask);
router.put('/:id/progress', protect, authorize('worker'), upload.array('images', 3), updateProgress);
router.post('/:id/complete', protect, authorize('worker'), upload.array('images', 5), completeTask);

// Shared / Admin task routes
router
  .route('/')
  .get(protect, authorize('admin', 'worker'), getTasks)
  .post(protect, authorize('admin'), createTask);

router.put('/:id/verify', protect, authorize('admin'), verifyTask);
router.put('/:id/reopen', protect, authorize('admin'), reopenTask);
router.put('/:id/reassign', protect, authorize('admin'), reassignTask);

module.exports = router;
