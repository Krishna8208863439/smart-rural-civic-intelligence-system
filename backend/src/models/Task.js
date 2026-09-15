const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign a field worker'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a task category'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: [true, 'Please provide a task description'],
      trim: true,
    },
    location: {
      address: { type: String, default: 'Chandoli' },
      landmark: { type: String, default: '' },
      village: { type: String, default: 'Gram Panchayat Chandoli' },
      ward: { type: String, default: 'Ward 1' },
      coordinates: {
        type: [Number],
        default: [74.2433, 16.9602],
      },
    },
    deadline: {
      type: Date,
      default: null,
    },
    requiredAction: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'VERIFIED', 'REOPENED'],
      default: 'ASSIGNED',
      index: true,
    },
    workerNotes: {
      type: String,
      default: '',
      trim: true,
    },
    beforeImage: {
      type: String,
      default: '',
    },
    afterImage: {
      type: String,
      default: '',
    },
    completionGps: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    progressUpdates: [
      {
        note: { type: String, required: true },
        image: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup & filtering
TaskSchema.index({ workerId: 1, status: 1 });
TaskSchema.index({ status: 1, priority: 1 });
TaskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', TaskSchema);
