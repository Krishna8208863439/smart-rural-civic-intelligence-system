const mongoose = require('mongoose');

const PreventiveActionSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    recurrenceProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurrenceProfile',
      default: null,
    },
    category: {
      type: String,
      required: true,
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
    },
    location: {
      name: { type: String, required: true },
      coordinates: { type: [Number], default: [73.8567, 18.5204] },
    },
    recommendedAction: {
      type: String,
      required: [true, 'Please specify the recommended action'],
      trim: true,
    },
    actionTaken: {
      type: String,
      default: '',
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['RECOMMENDED', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'RECOMMENDED',
    },
    beforeFrequency: {
      type: Number,
      default: 0, // e.g., 8 complaints in prior 60 days
    },
    afterFrequency: {
      type: Number,
      default: 0, // e.g., 1 complaint in next 60 days
    },
    reductionPercentage: {
      type: Number,
      default: 0, // e.g. 87.5%
    },
    effectivenessScore: {
      type: Number,
      default: null, // 0-100
    },
    effectivenessLevel: {
      type: String,
      enum: ['Pending Evaluation', 'Low', 'Moderate', 'High', 'Very High'],
      default: 'Pending Evaluation',
    },
    evidence: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PreventiveActionSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('PreventiveAction', PreventiveActionSchema);
