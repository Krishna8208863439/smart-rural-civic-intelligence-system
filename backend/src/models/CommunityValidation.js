const mongoose = require('mongoose');

const CommunityValidationSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: 'Citizen',
    },
    response: {
      type: String,
      enum: ['CONFIRM', 'STILL_EXISTS', 'RESOLVED'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CommunityValidationSchema.index({ issueId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityValidation', CommunityValidationSchema);
