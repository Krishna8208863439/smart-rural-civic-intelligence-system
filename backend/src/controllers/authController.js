const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, role = 'citizen', workerId = null) => {
  return jwt.sign(
    { id, role, workerId },
    process.env.JWT_SECRET || 'srci_jwt_secret_production_ready_rural_intelligence_2025',
    { expiresIn: '30d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, village, language, phone, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Block admin and worker registration: Only citizen accounts can be registered publicly
    if (role === 'admin' || role === 'worker') {
      return res.status(403).json({
        success: false,
        message: 'Only Citizen accounts can be registered publicly.',
      });
    }

    const assignedRole = 'citizen';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: assignedRole,
      village: village || 'Gram Panchayat Chandoli',
      language: language || 'en',
      phone: phone || '',
      specialization: specialization || 'General',
    });


    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village,
        language: user.language,
        phone: user.phone,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user (Citizen, Admin, or Field Worker)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    let { email, password, identifier, workerId } = req.body;

    const loginId = (email || identifier || workerId || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Email, Worker ID, or Mobile Number and Password',
      });
    }

    const cleanInput = loginId.toLowerCase();

    // Check if user exists by email, workerId (case-insensitive), or phone number
    let user = await User.findOne({
      $or: [
        { email: cleanInput },
        { workerId: { $regex: new RegExp(`^${loginId}$`, 'i') } },
        { phone: loginId },
      ],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.matchPassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact Panchayat admin.',
      });
    }

    // Strict Admin verification: Only authorized admin can log in as Admin
    const allowedAdminEmails = ['krishna@gmail.com'];
    if (user.role === 'admin' && !allowedAdminEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only authorized Panchayat Admin (krishna@gmail.com) can log in.',
      });
    }

    // Record lastLogin timestamp for workers
    if (user.role === 'worker') {
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    const normalizedRole = user.role === 'worker' ? 'worker' : user.role;
    const token = generateToken(user._id, normalizedRole, user.workerId);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.phone || '',
        phone: user.phone || '',
        role: normalizedRole,
        village: user.village,
        language: user.language,
        specialization: user.specialization,
        workerId: user.workerId || null,
        assignedArea: user.assignedArea || 'Chandoli',
        workerRole: user.workerRole || user.specialization || 'Field Worker',
        status: user.isActive ? 'Active' : 'Inactive',
        isActive: !!user.isActive,
        mustChangePassword: !!user.mustChangePassword,
        lastLogin: user.lastLogin || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const normalizedRole = user.role === 'worker' ? 'worker' : user.role;
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.phone || '',
        phone: user.phone || '',
        role: normalizedRole,
        village: user.village,
        language: user.language,
        specialization: user.specialization,
        workerId: user.workerId || null,
        assignedArea: user.assignedArea || 'Chandoli',
        workerRole: user.workerRole || user.specialization || 'Field Worker',
        status: user.isActive ? 'Active' : 'Inactive',
        isActive: !!user.isActive,
        mustChangePassword: !!user.mustChangePassword,
        lastLogin: user.lastLogin || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user language
// @route   PUT /api/auth/language
// @access  Private
exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'mr', 'hi'].includes(language)) {
      return res.status(400).json({ success: false, message: 'Invalid language code' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    );

    res.status(200).json({
      success: true,
      language: user.language,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Forgot Password - Request 6-digit Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });



    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact Panchayat admin.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordExpire = expireTime;
    await user.save({ validateBeforeSave: false });

    console.log(`[AUTH] Password reset OTP for ${user.email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'Password reset verification code has been generated.',
      otp, // Provided for instant demo and local village validation
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
    });
  }
};

// @desc    Reset Password with 6-digit OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, 6-digit verification code, and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail }).select('+passwordHash +resetPasswordOtp +resetPasswordExpire');



    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordExpire) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found. Please request a new code.',
      });
    }

    if (user.resetPasswordExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    if (user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    // Set new password (pre('save') hook hashes password)
    user.passwordHash = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
    });
  }
};

// @desc    Update / Change password (e.g. Worker first login or profile update)
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (currentPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    user.passwordHash = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Server error updating password' });
  }
};


