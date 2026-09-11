const mongoose = require('mongoose');

const IssueHistorySchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'CREATED',
        'STATUS_CHANGE',
        'RELIABILITY_EVALUATED',
        'PRIORITY_UPDATED',
        'WORKER_ASSIGNED',
        'WORK_STARTED',
        'PROGRESS_NOTE',
        'ACTION_COMPLETED',
        'COMMUNITY_VALIDATED',
        'RESOLUTION_VERIFIED',
        'CITIZEN_FEEDBACK',
        'REOPENED',
        'EVIDENCE_ADDED',
        'PREVENTIVE_LINKED',
        'LOCATION_UPDATED',
      ],
    },
    previousState: {
      type: String,
      default: '',
    },
    newState: {
      type: String,
      default: '',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: 'System',
    },
    userRole: {
      type: String,
      default: 'system',
    },
    comment: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

IssueHistorySchema.index({ issueId: 1, timestamp: -1 });

module.exports = mongoose.model('IssueHistory', IssueHistorySchema);
