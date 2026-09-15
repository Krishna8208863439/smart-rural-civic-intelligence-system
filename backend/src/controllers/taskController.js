const Task = require('../models/Task');
const Issue = require('../models/Issue');
const User = require('../models/User');
const IssueHistory = require('../models/IssueHistory');
const Notification = require('../models/Notification');
const { processUploadedFile } = require('../config/cloudinary');

// Helper: Auto-generate sequential Task ID (e.g. TSK-1001)
async function generateUniqueTaskId() {
  const count = await Task.countDocuments();
  let num = 1001 + count;
  let candidate = `TSK-${num}`;
  while (await Task.findOne({ taskId: candidate })) {
    num += 1;
    candidate = `TSK-${num}`;
  }
  return candidate;
}

// @desc    Create and assign a new field task
// @route   POST /api/tasks
// @access  Private (Admin)
exports.createTask = async (req, res) => {
  try {
    const {
      workerId,
      issueId,
      title,
      category,
      priority,
      description,
      location,
      deadline,
      requiredAction,
      beforeImage,
    } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Please select a field worker' });
    }
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide task title and description' });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ success: false, message: 'Assigned worker not found' });
    }

    const taskId = await generateUniqueTaskId();

    // Default image from linked issue or sample category photo
    let initialBeforeImage = beforeImage || '';
    let linkedIssue = null;

    if (issueId) {
      linkedIssue = await Issue.findById(issueId);
      if (linkedIssue) {
        if (!initialBeforeImage && linkedIssue.images && linkedIssue.images.length > 0) {
          initialBeforeImage = linkedIssue.images[0].url;
        }
        linkedIssue.assignedWorker = workerId;
        linkedIssue.assignedAt = new Date();
        if (['NEW', 'VALIDATED'].includes(linkedIssue.status)) {
          linkedIssue.status = 'ASSIGNED';
        }
        await linkedIssue.save();

        await IssueHistory.create({
          issueId: linkedIssue._id,
          eventType: 'WORKER_ASSIGNED',
          previousState: 'NEW',
          newState: linkedIssue.status,
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Task ${taskId} assigned to ${worker.name} (${worker.workerRole || worker.specialization}). Action: ${requiredAction || 'Inspect & resolve'}`,
          metadata: { taskId, workerId, workerName: worker.name },
        });

        // Notify citizen
        await Notification.create({
          userId: linkedIssue.createdBy,
          roleTarget: 'citizen',
          type: 'STATUS_UPDATED',
          title: `Worker Assigned: ${linkedIssue.title}`,
          message: `Specialist ${worker.name} has been dispatched for task ${taskId}.`,
          issueId: linkedIssue._id,
        });
      }
    }

    const parsedDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h default

    const task = await Task.create({
      taskId,
      issueId: issueId || null,
      workerId,
      assignedBy: req.user.id,
      title: title.trim(),
      category: category || linkedIssue?.category || 'General',
      priority: priority || linkedIssue?.priority?.level || 'Medium',
      description: description.trim(),
      location: {
        address: location?.address || linkedIssue?.location?.address || 'Chandoli Main Road',
        landmark: location?.landmark || linkedIssue?.location?.landmark || '',
        village: location?.village || linkedIssue?.location?.village || 'Gram Panchayat Chandoli',
        ward: location?.ward || linkedIssue?.location?.ward || 'Ward 1',
        coordinates: location?.coordinates || linkedIssue?.location?.coordinates || [74.2433, 16.9602],
      },
      deadline: parsedDeadline,
      requiredAction: requiredAction || 'Inspect site, repair issue, upload after photos, and mark completed.',
      beforeImage: initialBeforeImage,
      status: 'ASSIGNED',
      assignedAt: new Date(),
    });

    // Notify worker
    await Notification.create({
      userId: worker._id,
      roleTarget: 'worker',
      type: 'TASK_ASSIGNED',
      title: `New Task Assigned: ${taskId}`,
      message: `You have been assigned ${title}. Priority: ${priority || 'Medium'}. Deadline: ${parsedDeadline.toLocaleDateString()}.`,
      issueId: issueId || null,
    });

    res.status(201).json({
      success: true,
      message: `Task ${taskId} assigned to ${worker.name} successfully`,
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error assigning task' });
  }
};

// @desc    Get all tasks with filters
// @route   GET /api/tasks
// @access  Private (Admin or Worker)
exports.getTasks = async (req, res) => {
  try {
    const { workerId, status, category, priority, overdue, search } = req.query;

    let filter = {};

    if (workerId && workerId !== 'all') {
      filter.workerId = workerId;
    } else if (req.user.role === 'worker') {
      // Default workers to their own tasks unless specifically allowed
      filter.workerId = req.user.id;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (priority && priority !== 'All') {
      filter.priority = priority;
    }

    if (overdue === 'true') {
      filter.deadline = { $lt: new Date() };
      filter.status = { $nin: ['COMPLETED', 'VERIFIED'] };
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { taskId: regex },
        { title: regex },
        { description: regex },
        { 'location.address': regex },
        { 'location.landmark': regex },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('workerId', 'name email phone workerId workerRole specialization assignedArea')
      .populate('assignedBy', 'name email')
      .populate('issueId', 'title category priority status images')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tasks' });
  }
};

// @desc    Get current worker's personal task queue and statistics
// @route   GET /api/tasks/my
// @access  Private (Worker)
exports.getMyTasks = async (req, res) => {
  try {
    const workerId = req.user.id;
    const now = new Date();

    const tasks = await Task.find({ workerId })
      .populate('assignedBy', 'name email')
      .populate('issueId', 'title category priority status images location')
      .sort({ createdAt: -1 })
      .lean();

    const pending = tasks.filter((t) => t.status === 'ASSIGNED').length;
    const inProgress = tasks.filter((t) => ['ACCEPTED', 'IN PROGRESS'].includes(t.status)).length;
    const completed = tasks.filter((t) => ['COMPLETED', 'VERIFIED'].includes(t.status)).length;
    const overdue = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && !['COMPLETED', 'VERIFIED'].includes(t.status)
    ).length;

    res.status(200).json({
      success: true,
      stats: {
        myTasks: tasks.length,
        pending,
        inProgress,
        completed,
        overdue,
      },
      tasks,
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving worker tasks' });
  }
};

// @desc    Worker accepts assigned task
// @route   PUT /api/tasks/:id/accept
// @access  Private (Worker)
exports.acceptTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = 'ACCEPTED';
    task.acceptedAt = new Date();
    await task.save();

    if (task.issueId) {
      await IssueHistory.create({
        issueId: task.issueId,
        eventType: 'STATUS_CHANGE',
        previousState: 'ASSIGNED',
        newState: 'ACCEPTED',
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        comment: `Worker ${req.user.name} accepted task ${task.taskId}. Preparing for on-site action.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Task ${task.taskId} accepted. You can now start work.`,
      task,
    });
  } catch (error) {
    console.error('Accept task error:', error);
    res.status(500).json({ success: false, message: 'Server error accepting task' });
  }
};

// @desc    Worker starts work on task
// @route   PUT /api/tasks/:id/start
// @access  Private (Worker)
exports.startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = 'IN PROGRESS';
    task.startedAt = new Date();
    await task.save();

    if (task.issueId) {
      const issue = await Issue.findById(task.issueId);
      if (issue) {
        issue.status = 'UNDER ACTION';
        await issue.save();

        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'WORK_STARTED',
          previousState: 'ASSIGNED',
          newState: 'UNDER ACTION',
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Worker ${req.user.name} started field repair for task ${task.taskId}.`,
        });

        // Notify citizen
        await Notification.create({
          userId: issue.createdBy,
          roleTarget: 'citizen',
          type: 'STATUS_UPDATED',
          title: `Repair in Progress: ${issue.title}`,
          message: `${req.user.name} has started work at the site.`,
          issueId: issue._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Task ${task.taskId} is now In Progress.`,
      task,
    });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ success: false, message: 'Server error starting task' });
  }
};

// @desc    Worker updates progress notes and images
// @route   PUT /api/tasks/:id/progress
// @access  Private (Worker)
exports.updateProgress = async (req, res) => {
  try {
    const { note, image } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    let progressImage = image || '';
    if (req.files && req.files.length > 0) {
      const uploaded = await processUploadedFile(req.files[0]);
      if (uploaded) progressImage = uploaded.url;
    }

    const progressEntry = {
      note: note || 'Progress update recorded by worker.',
      image: progressImage,
      timestamp: new Date(),
    };

    task.progressUpdates.push(progressEntry);
    if (task.status === 'ASSIGNED' || task.status === 'ACCEPTED') {
      task.status = 'IN PROGRESS';
      task.startedAt = task.startedAt || new Date();
    }
    await task.save();

    if (task.issueId) {
      await IssueHistory.create({
        issueId: task.issueId,
        eventType: 'PROGRESS_NOTE',
        previousState: task.status,
        newState: task.status,
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        comment: progressEntry.note,
        metadata: { image: progressImage },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress update recorded successfully',
      task,
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ success: false, message: 'Server error recording progress' });
  }
};

// @desc    Worker marks task completed with proof notes, photo, and optional GPS
// @route   POST /api/tasks/:id/complete
// @access  Private (Worker)
exports.completeTask = async (req, res) => {
  try {
    const { notes, afterImage, sampleImageUrl, latitude, longitude } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    let finalAfterImage = afterImage || sampleImageUrl || '';
    if (req.files && req.files.length > 0) {
      const uploaded = await processUploadedFile(req.files[0]);
      if (uploaded) finalAfterImage = uploaded.url;
    }

    // High quality civic repair fallback if none provided
    if (!finalAfterImage) {
      const cat = (task.category || '').toLowerCase();
      if (cat.includes('road') || cat.includes('pothole')) {
        finalAfterImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800';
      } else if (cat.includes('waste') || cat.includes('sanitation') || cat.includes('drain')) {
        finalAfterImage = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800';
      } else if (cat.includes('light') || cat.includes('electrical')) {
        finalAfterImage = 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?w=800';
      } else {
        finalAfterImage = 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800';
      }
    }

    task.status = 'COMPLETED';
    task.completedAt = new Date();
    task.workerNotes = notes || 'Field repair successfully finished. Ready for admin verification.';
    task.afterImage = finalAfterImage;

    if (latitude && longitude) {
      task.completionGps = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
    }

    await task.save();

    // Synchronize with linked Issue
    if (task.issueId) {
      const issue = await Issue.findById(task.issueId);
      if (issue) {
        const previousState = issue.status;
        issue.status = 'ACTION COMPLETED';
        issue.resolvedAt = new Date();
        issue.completionDetails = {
          notes: task.workerNotes,
          images: [{ url: finalAfterImage, uploadedAt: new Date() }],
          completedAt: new Date(),
        };
        await issue.save();

        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'ACTION_COMPLETED',
          previousState,
          newState: 'ACTION COMPLETED',
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Task ${task.taskId} marked completed by ${req.user.name}. Resolution proof uploaded for Admin review.`,
          metadata: {
            notes: task.workerNotes,
            afterImage: finalAfterImage,
            completedAt: task.completedAt,
          },
        });

        // Notify Citizen
        await Notification.create({
          userId: issue.createdBy,
          roleTarget: 'citizen',
          type: 'STATUS_UPDATED',
          title: `Repair Completed by Field Team: ${issue.title}`,
          message: `Worker ${req.user.name} submitted completion proof for task ${task.taskId}. Awaiting Panchayat Admin verification.`,
          issueId: issue._id,
        });
      }
    }

    // Notify Admin
    await Notification.create({
      roleTarget: 'admin',
      type: 'ACTION_COMPLETED',
      title: `Proof Uploaded: Task ${task.taskId}`,
      message: `Worker ${req.user.name} completed task "${task.title}". Submitted for Admin Verification.`,
      issueId: task.issueId || null,
    });

    res.status(200).json({
      success: true,
      message: `Task ${task.taskId} marked completed and submitted for Admin verification.`,
      task,
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ success: false, message: 'Server error completing task' });
  }
};

// @desc    Admin verifies completed task
// @route   PUT /api/tasks/:id/verify
// @access  Private (Admin)
exports.verifyTask = async (req, res) => {
  try {
    const { notes } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = 'VERIFIED';
    task.verifiedAt = new Date();
    await task.save();

    if (task.issueId) {
      const issue = await Issue.findById(task.issueId);
      if (issue) {
        issue.status = 'VERIFIED RESOLVED';
        issue.verifiedAt = new Date();
        issue.adminVerification = {
          verifiedBy: req.user.id,
          verifiedAt: new Date(),
          notes: notes || 'Panchayat Admin verified field resolution proof.',
          forwardedToCitizen: true,
        };
        await issue.save();

        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'RESOLUTION_VERIFIED',
          previousState: 'ACTION COMPLETED',
          newState: 'VERIFIED RESOLVED',
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Panchayat Admin verified and approved field work for Task ${task.taskId}. Issue resolved.`,
          metadata: { notes: issue.adminVerification.notes },
        });

        // Notify Citizen
        await Notification.create({
          userId: issue.createdBy,
          roleTarget: 'citizen',
          type: 'STATUS_UPDATED',
          title: `Issue Resolved & Verified: ${issue.title}`,
          message: `Panchayat Admin has verified the repair. Please provide your feedback rating.`,
          issueId: issue._id,
        });
      }
    }

    // Notify Worker
    await Notification.create({
      userId: task.workerId,
      roleTarget: 'worker',
      type: 'STATUS_UPDATED',
      title: `Task Verified: ${task.taskId}`,
      message: `Admin approved your completion of "${task.title}". Great work!`,
      issueId: task.issueId || null,
    });

    res.status(200).json({
      success: true,
      message: `Task ${task.taskId} verified and approved as resolved.`,
      task,
    });
  } catch (error) {
    console.error('Verify task error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying task' });
  }
};

// @desc    Admin reopens a task for rework
// @route   PUT /api/tasks/:id/reopen
// @access  Private (Admin)
exports.reopenTask = async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = 'REOPENED';
    await task.save();

    if (task.issueId) {
      const issue = await Issue.findById(task.issueId);
      if (issue) {
        issue.status = 'REOPENED';
        await issue.save();

        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'REOPENED',
          previousState: 'ACTION COMPLETED',
          newState: 'REOPENED',
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Task ${task.taskId} reopened by Admin. Reason: ${reason || 'Work incomplete or requires further rectification.'}`,
        });
      }
    }

    // Notify Worker
    await Notification.create({
      userId: task.workerId,
      roleTarget: 'worker',
      type: 'TASK_REOPENED',
      title: `Task Reopened: ${task.taskId}`,
      message: `Admin requested rework on "${task.title}". Reason: ${reason || 'Please inspect again.'}`,
      issueId: task.issueId || null,
    });

    res.status(200).json({
      success: true,
      message: `Task ${task.taskId} reopened for rectification`,
      task,
    });
  } catch (error) {
    console.error('Reopen task error:', error);
    res.status(500).json({ success: false, message: 'Server error reopening task' });
  }
};

// @desc    Admin reassigns task to a different worker
// @route   PUT /api/tasks/:id/reassign
// @access  Private (Admin)
exports.reassignTask = async (req, res) => {
  try {
    const { workerId, notes } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const newWorker = await User.findById(workerId);
    if (!newWorker || newWorker.role !== 'worker') {
      return res.status(404).json({ success: false, message: 'New worker not found' });
    }

    task.workerId = newWorker._id;
    task.status = 'ASSIGNED';
    task.assignedAt = new Date();
    await task.save();

    if (task.issueId) {
      const issue = await Issue.findById(task.issueId);
      if (issue) {
        issue.assignedWorker = newWorker._id;
        issue.assignedAt = new Date();
        await issue.save();

        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'WORKER_ASSIGNED',
          previousState: issue.status,
          newState: 'ASSIGNED',
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Reassigned to ${newWorker.name}. Note: ${notes || ''}`,
        });
      }
    }

    // Notify new worker
    await Notification.create({
      userId: newWorker._id,
      roleTarget: 'worker',
      type: 'TASK_ASSIGNED',
      title: `Task Assigned: ${task.taskId}`,
      message: `You have been reassigned task "${task.title}".`,
      issueId: task.issueId || null,
    });

    res.status(200).json({
      success: true,
      message: `Task ${task.taskId} reassigned to ${newWorker.name}`,
      task,
    });
  } catch (error) {
    console.error('Reassign task error:', error);
    res.status(500).json({ success: false, message: 'Server error reassigning task' });
  }
};
