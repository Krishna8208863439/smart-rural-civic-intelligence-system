const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  assignWorker,
  addEvidence,
  getIssueHistory,
  adminVerifyResolution,
  submitCitizenFeedback,
  aiDetectIssue,
  updateIssueLocation,
} = require('../controllers/issueController');
const { validateIssue, getIssueValidations } = require('../controllers/validationController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// AI Issue Detection from Photo or Text
router.post('/ai-detect', upload.single('image'), aiDetectIssue);

// Issues
router
  .route('/')
  .post(protect, upload.array('images', 5), createIssue)
  .get(getIssues);

router.route('/:id').get(getIssueById);

router.put('/:id/status', protect, updateIssueStatus);
router.put('/:id/location', protect, updateIssueLocation);
router.put('/:id/admin-verify', protect, authorize('admin'), adminVerifyResolution);
router.post('/:id/feedback', protect, submitCitizenFeedback);
router.post('/:id/evidence', protect, upload.array('images', 5), addEvidence);
router.get('/:id/history', getIssueHistory);

// Community Validation
router.post('/:id/validate', protect, validateIssue);
router.get('/:id/validations', getIssueValidations);

module.exports = router;
