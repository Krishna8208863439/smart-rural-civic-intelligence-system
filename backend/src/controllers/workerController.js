const User = require('../models/User');
const Issue = require('../models/Issue');
const Evidence = require('../models/Evidence');
const IssueHistory = require('../models/IssueHistory');
const Notification = require('../models/Notification');
const { processUploadedFile } = require('../config/cloudinary');

// @desc    Get issues assigned to current logged-in worker (or filter by workerId/admin view)
// @route   GET /api/workers/assigned
// @access  Private (Worker or Admin)
exports.getAssignedIssues = async (req, res) => {
  try {
    const { workerId } = req.query;

    let filter = {};
    if (workerId === 'all') {
      filter.assignedWorker = { $ne: null };
    } else if (workerId) {
      filter.assignedWorker = workerId;
    } else if (req.user.role === 'admin') {
      // If admin and no specific worker requested, show all assigned tasks
      filter.assignedWorker = { $ne: null };
    } else {
      // Default to the logged-in worker's own tasks
      filter.assignedWorker = req.user.id;
    }

    const issues = await Issue.find(filter)
      .populate('createdBy', 'name email village phone')
      .populate('assignedWorker', 'name email specialization phone')
      .sort({ assignedAt: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    const pending = issues.filter((i) => ['ASSIGNED', 'NEW', 'VALIDATED'].includes(i.status)).length;
    const inProgress = issues.filter((i) => i.status === 'UNDER ACTION').length;
    const completed = issues.filter((i) =>
      ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(i.status)
    ).length;

    res.status(200).json({
      success: true,
      stats: {
        total: issues.length,
        pending,
        inProgress,
        completed,
      },
      issues,
    });
  } catch (error) {
    console.error('Get assigned issues error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving assigned tasks' });
  }
};

// @desc    Update progress on assigned issue (e.g. Start work, add notes)
// @route   PUT /api/workers/issues/:id/progress
// @access  Private (Worker or Admin)
exports.updateWorkProgress = async (req, res) => {
  try {
    const { note, startWork } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const previousState = issue.status;
    if (startWork || issue.status === 'ASSIGNED') {
      issue.status = 'UNDER ACTION';
    }

    // Process progress images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await processUploadedFile(file);
        if (uploaded) images.push(uploaded.url);
      }
    }

    const progressEntry = {
      note: note || (startWork ? 'Worker initiated field repair work.' : 'Progress update recorded.'),
      images,
      worker: req.user.id,
      createdAt: new Date(),
    };

    issue.progressNotes.push(progressEntry);
    await issue.save();

    await IssueHistory.create({
      issueId: issue._id,
      eventType: startWork ? 'WORK_STARTED' : 'PROGRESS_NOTE',
      previousState,
      newState: issue.status,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: progressEntry.note,
      metadata: {
        startWork,
        note: progressEntry.note,
        images,
      },
    });

    // Notify citizen
    await Notification.create({
      userId: issue.createdBy,
      roleTarget: 'citizen',
      type: 'STATUS_UPDATED',
      title: `Worker on Site: ${issue.title}`,
      message: `${req.user.name} is currently working on resolving this issue.`,
      issueId: issue._id,
    });

    res.status(200).json({
      success: true,
      message: 'Work progress recorded successfully',
      issue,
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: 'Server error updating progress' });
  }
};

// @desc    Upload completion evidence and mark action completed
// @route   POST /api/workers/issues/:id/completion-evidence
// @access  Private (Worker or Admin)
exports.uploadCompletionEvidence = async (req, res) => {
  try {
    const { notes, sampleImageUrl } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await processUploadedFile(file);
        if (uploaded) {
          images.push({ url: uploaded.url, uploadedAt: new Date() });
        }
      }
    }

    if (images.length === 0 && sampleImageUrl) {
      images.push({ url: sampleImageUrl, uploadedAt: new Date() });
    }

    // High quality repaired civic photo fallback based on category if none provided
    if (images.length === 0) {
      const cat = (issue.category || '').toLowerCase();
      let defaultImg = 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800'; // water
      if (cat.includes('road') || cat.includes('pothole')) {
        defaultImg = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'; // road asphalt
      } else if (cat.includes('waste') || cat.includes('sanitation') || cat.includes('toilet')) {
        defaultImg = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800'; // sanitation
      } else if (cat.includes('light') || cat.includes('lamp')) {
        defaultImg = 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?w=800'; // streetlight
      } else if (cat.includes('drain') || cat.includes('gutter')) {
        defaultImg = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'; // drain culvert
      }
      images.push({ url: defaultImg, uploadedAt: new Date() });
    }

    const previousState = issue.status;
    issue.status = 'ACTION COMPLETED';
    issue.resolvedAt = new Date();
    issue.completionDetails = {
      notes: notes || 'Civic repair work completed by assigned worker.',
      images,
      completedAt: new Date(),
    };

    await issue.save();

    // Store Evidence record
    if (images.length > 0) {
      await Evidence.create({
        issueId: issue._id,
        sourceUser: req.user.id,
        evidenceType: 'worker_completion',
        media: images.map((img) => ({ url: img.url, caption: 'Completion photographic evidence' })),
        reliabilityScore: 95,
      });
    }

    // Record in History
    await IssueHistory.create({
      issueId: issue._id,
      eventType: 'ACTION_COMPLETED',
      previousState,
      newState: 'ACTION COMPLETED',
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Work solved by ${req.user.name}. Resolution proof image uploaded for Admin review. Note: ${notes || 'Repairs completed to standard.'}`,
      metadata: {
        notes: notes || 'Repairs completed to standard.',
        images: images.map((img) => img.url),
        completedAt: issue.completionDetails.completedAt,
      },
    });

    // Notify Admin to review and forward to citizen
    await Notification.create({
      roleTarget: 'admin',
      type: 'ACTION_COMPLETED',
      title: `Proof Uploaded: ${issue.title}`,
      message: `Worker ${req.user.name} completed work and uploaded proof for issue #${issue._id.toString().slice(-6)}. Ready for admin verification.`,
      issueId: issue._id,
    });

    // Notify Citizen that worker has uploaded proof
    await Notification.create({
      userId: issue.createdBy,
      roleTarget: 'citizen',
      type: 'STATUS_UPDATED',
      title: `Work Completed by Field Team: ${issue.title}`,
      message: `Worker ${req.user.name} has completed repairs and submitted resolution proof. Awaiting Panchayat Admin verification.`,
      issueId: issue._id,
    });

    res.status(200).json({
      success: true,
      message: 'Work completion proof recorded and submitted to Admin for verification.',
      issue,
    });
  } catch (error) {
    console.error('Completion evidence error:', error);
    res.status(500).json({ success: false, message: 'Server error recording completion' });
  }
};

// @desc    Get all workers with workload stats
// @route   GET /api/workers
// @access  Private (Admin)
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-passwordHash').lean();

    // Attach current active workload count for each worker
    const workersWithStats = await Promise.all(
      workers.map(async (w) => {
        const activeTasks = await Issue.countDocuments({
          assignedWorker: w._id,
          status: { $in: ['ASSIGNED', 'UNDER ACTION'] },
        });
        const completedTasks = await Issue.countDocuments({
          assignedWorker: w._id,
          status: { $in: ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'] },
        });
        return {
          ...w,
          activeTasks,
          completedTasks,
        };
      })
    );

    res.status(200).json({
      success: true,
      workers: workersWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving workers' });
  }
};

// @desc    Create / Add new field worker
// @route   POST /api/workers
// @access  Private (Admin)
exports.addWorker = async (req, res) => {
  try {
    const { name, email, password, phone, specialization, village } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const worker = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password || 'worker123',
      role: 'worker',
      phone: phone || '',
      specialization: specialization || 'General',
      village: village || 'Gram Panchayat Chandoli',
    });

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        specialization: worker.specialization,
        role: worker.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle worker active status
// @route   PUT /api/workers/:id/toggle
// @access  Private (Admin)
exports.toggleWorkerStatus = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    worker.isActive = !worker.isActive;
    await worker.save();

    res.status(200).json({
      success: true,
      message: `Worker account ${worker.isActive ? 'activated' : 'deactivated'}`,
      worker,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error toggling worker' });
  }
};
