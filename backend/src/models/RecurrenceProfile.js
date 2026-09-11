const mongoose = require('mongoose');

const RecurrenceProfileSchema = new mongoose.Schema(
  {
    locationPattern: {
      name: { type: String, required: true, trim: true },
      coordinates: {
        type: [Number],
        required: true,
      },
      radiusMeters: { type: Number, default: 200 },
      village: { type: String, default: 'Gram Panchayat Chandoli' },
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
    frequency: {
      type: Number,
      default: 1,
    },
    intervals: [
      {
        type: Number, // days between occurrences
      },
    ],
    averageIntervalDays: {
      type: Number,
      default: 0,
    },
    seasonalIndicators: {
      monsoonCorrelation: { type: Number, default: 0 }, // 0 to 100%
      summerCorrelation: { type: Number, default: 0 },
      winterCorrelation: { type: Number, default: 0 },
      peakMonths: [{ type: String }],
    },
    reReportRate: {
      type: Number,
      default: 0, // % of issues reported again within 30 days
    },
    resolutionStability: {
      type: String,
      enum: ['High', 'Moderate', 'Fragile', 'Unstable'],
      default: 'Moderate',
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
    linkedIssueIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
      },
    ],
    probableCauses: [
      {
        cause: { type: String, required: true },
        confidence: { type: Number, required: true },
        observations: [{ type: String }],
      },
    ],
    preventiveRecommendations: [
      {
        action: { type: String, required: true },
        priority: { type: String, enum: ['Routine', 'Medium', 'Urgent'], default: 'Medium' },
        timeframe: { type: String, default: 'Within 30 days' },
      },
    ],
    lastEvaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

RecurrenceProfileSchema.index({ 'locationPattern.coordinates': '2dsphere' });
RecurrenceProfileSchema.index({ category: 1, recurrenceRisk: -1 });

module.exports = mongoose.model('RecurrenceProfile', RecurrenceProfileSchema);
