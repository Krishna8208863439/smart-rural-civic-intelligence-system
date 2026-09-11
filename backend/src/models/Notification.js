const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for broadcast to a role
      index: true,
    },
    roleTarget: {
      type: String,
      enum: ['citizen', 'admin', 'worker', 'all'],
      default: 'all',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'ISSUE_CREATED',
        'STATUS_UPDATED',
        'WORKER_ASSIGNED',
        'WORK_STARTED',
        'ACTION_COMPLETED',
        'VERIFICATION_REQUIRED',
        'ISSUE_REOPENED',
        'COMMUNITY_VALIDATED',
        'HIGH_RECURRENCE_ALERT',
        'PREVENTIVE_ACTION_DUE',
        'CRITICAL_ALERT',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
