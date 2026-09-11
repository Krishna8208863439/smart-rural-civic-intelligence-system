const express = require('express');
const router = express.Router();
const { register, login, getMe, updateLanguage, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/language', protect, updateLanguage);

module.exports = router;

