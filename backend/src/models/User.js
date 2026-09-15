const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['citizen', 'admin', 'worker'],
      default: 'citizen',
    },
    village: {
      type: String,
      default: 'Gram Panchayat Chandoli',
      trim: true,
    },
    language: {
      type: String,
      enum: ['en', 'mr', 'hi'],
      default: 'en',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    specialization: {
      type: String,
      enum: ['General', 'Sanitation & Waste', 'Roads & Works', 'Water Supply', 'Electrical & Lighting'],
      default: 'General',
    },
    workerId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    assignedArea: {
      type: String,
      default: 'Chandoli',
      trim: true,
    },
    workerRole: {
      type: String,
      enum: [
        'Field Worker',
        'Sanitation Worker',
        'Water Maintenance Worker',
        'Road Maintenance Worker',
        'Electrical/Streetlight Worker',
        'General',
      ],
      default: 'Field Worker',
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password helper
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
