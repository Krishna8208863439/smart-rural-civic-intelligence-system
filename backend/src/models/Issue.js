const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an issue title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select an issue category'],
      enum: [
        'Waste accumulation',
        'Drainage blockage',
        'Water leakage',
        'Damaged road',
        'Streetlight failure',
        'Water supply',
        'Sanitation',
        'Other',
      ],
      default: 'Other',
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        format: { type: String, default: 'jpg' },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
        required: [true, 'Please provide GPS coordinates'],
        validate: {
          validator: function (v) {
            return Array.isArray(v) && v.length === 2;
          },
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
      address: {
        type: String,
        trim: true,
        default: 'Gram Panchayat Chandoli Area',
      },
      landmark: {
        type: String,
        trim: true,
        default: '',
      },
      village: {
        type: String,
        default: 'Gram Panchayat Chandoli',
      },
      ward: {
        type: String,
        default: 'Ward 1',
      },
    },
    status: {
      type: String,
      enum: [
        'NEW',
        'VALIDATED',
        'ASSIGNED',
        'UNDER ACTION',
        'ACTION COMPLETED',
        'MONITORING',
        'VERIFIED RESOLVED',
        'REOPENED',
      ],
      default: 'NEW',
    },
    priority: {
      score: { type: Number, default: 50, min: 0, max: 100 },
      level: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
      },
      factors: {
        severityWeight: { type: Number, default: 0 },
        reportsWeight: { type: Number, default: 0 },
        pendingWeight: { type: Number, default: 0 },
        locationSensitivity: { type: Number, default: 0 },
        communityWeight: { type: Number, default: 0 },
        explanation: { type: String, default: '' },
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    reliabilityScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    reliabilityLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Very High'],
      default: 'High',
    },
    reliabilityFactors: {
      locationConsistency: { type: Number, default: 80 },
      timeConsistency: { type: Number, default: 90 },
      metadataScore: { type: Number, default: 75 },
      nearbySimilarity: { type: Number, default: 50 },
      communityScore: { type: Number, default: 60 },
      summary: { type: String, default: '' },
    },
    adaptiveVerificationPath: {
      type: String,
      enum: ['auto_validated', 'community_confirmation', 'manual_review'],
      default: 'auto_validated',
    },
    recurrenceRisk: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    recurrenceLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Very High'],
      default: 'Low',
    },
    recurrenceFactors: {
      historicalCount: { type: Number, default: 0 },
      averageIntervalDays: { type: Number, default: 0 },
      seasonalPattern: { type: String, default: 'None' },
      reReportRate: { type: Number, default: 0 },
      resolutionStability: { type: String, default: 'Stable' },
      summary: { type: String, default: '' },
    },
    rootCauses: [
      {
        cause: { type: String, required: true },
        confidence: { type: Number, required: true },
        observations: [{ type: String }],
        status: { type: String, enum: ['PROPOSED', 'ACCEPTED', 'REJECTED'], default: 'PROPOSED' },
      },
    ],
    preventiveRecommendations: [
      {
        action: { type: String, required: true },
        priority: { type: String, enum: ['Routine', 'Medium', 'Urgent'], default: 'Medium' },
        timeframe: { type: String, default: 'Within 30 days' },
        suggestedBy: { type: String, default: 'PreventiveRecommendationService' },
      },
    ],
    communityValidationStats: {
      confirms: { type: Number, default: 0 },
      stillExists: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 },
    },
    voiceTranscript: {
      type: String,
      default: '',
    },
    progressNotes: [
      {
        note: { type: String, required: true },
        images: [{ type: String }],
        worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    completionDetails: {
      notes: { type: String, default: '' },
      images: [
        {
          url: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      completedAt: { type: Date, default: null },
    },
    adminVerification: {
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      verifiedAt: { type: Date, default: null },
      notes: { type: String, default: '' },
      forwardedToCitizen: { type: Boolean, default: false },
    },
    citizenFeedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      satisfied: { type: Boolean, default: null },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    aiDetection: {
      detectedCategory: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
      tags: [{ type: String }],
      rootCause: { type: String, default: '' },
      preventiveAction: { type: String, default: '' },
      autoPopulated: { type: Boolean, default: false },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// GeoJSON index for geospatial location queries
IssueSchema.index({ 'location.coordinates': '2dsphere' });
IssueSchema.index({ category: 1, status: 1 });
IssueSchema.index({ createdBy: 1 });
IssueSchema.index({ assignedWorker: 1 });

module.exports = mongoose.model('Issue', IssueSchema);
