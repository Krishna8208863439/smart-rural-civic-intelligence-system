const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  recordAction,
  updateAction,
  evaluateEffectiveness,
  getPreventiveActions,
} = require('../controllers/preventionController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/recommendations', protect, getRecommendations);
router.route('/actions').get(protect, getPreventiveActions);
router.post('/action', protect, authorize('admin'), recordAction);
router.put('/action/:id', protect, upload.array('evidence', 4), updateAction);
router.get('/effectiveness/:id', protect, evaluateEffectiveness);

module.exports = router;
