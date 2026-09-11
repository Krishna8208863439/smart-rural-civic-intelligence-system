const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    sourceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evidenceType: {
      type: String,
      enum: [
        'initial_report',
        'additional_citizen',
        'worker_progress',
        'worker_completion',
        'citizen_verification',
        'community_corroboration',
      ],
      default: 'initial_report',
    },
    media: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reliabilityScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    metadata: {
      hasGpsExif: { type: Boolean, default: false },
      deviceTimestamp: { type: Date, default: Date.now },
      ipAddress: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Evidence', EvidenceSchema);
