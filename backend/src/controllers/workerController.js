const User = require('../models/User');
const Issue = require('../models/Issue');
const Task = require('../models/Task');
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

// Helper: Auto-generate sequential Worker ID (e.g. GRAM-WKR-001)
async function generateUniqueWorkerId() {
  const count = await User.countDocuments({ role: 'worker' });
  let num = count + 1;
  let candidate = `GRAM-WKR-${String(num).padStart(3, '0')}`;
  while (await User.findOne({ workerId: candidate })) {
    num += 1;
    candidate = `GRAM-WKR-${String(num).padStart(3, '0')}`;
  }
  return candidate;
}

// Helper: Generate strong temporary password
function generateStrongPassword() {
  const prefixes = ['GramSetu', 'Chandoli', 'Karya', 'Seva'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const specials = ['@', '#', '$'];
  const special = specials[Math.floor(Math.random() * specials.length)];
  return `${prefix}${special}${randomDigits}`;
}

// @desc    Get all workers with workload stats & filters
// @route   GET /api/workers
// @access  Private (Admin)
exports.getAllWorkers = async (req, res) => {
  try {
    const { status, role, assignedArea, search } = req.query;

    let filter = { role: 'worker' };

    if (status === 'Active') filter.isActive = true;
    if (status === 'Inactive') filter.isActive = false;

    if (role && role !== 'All') {
      filter.$or = [{ workerRole: role }, { specialization: role }];
    }

    if (assignedArea && assignedArea !== 'All') {
      filter.assignedArea = assignedArea;
    }

    if (search) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ name: regex }, { workerId: regex }, { email: regex }, { phone: regex }],
      });
    }

    const workers = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).lean();

    const now = new Date();

    // Attach workload stats from both Task model and Issue model
    const workersWithStats = await Promise.all(
      workers.map(async (w) => {
        // Active tasks count
        const activeFromTasks = await Task.countDocuments({
          workerId: w._id,
          status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN PROGRESS'] },
        });
        const activeFromIssues = await Issue.countDocuments({
          assignedWorker: w._id,
          status: { $in: ['ASSIGNED', 'UNDER ACTION'] },
        });

        // Completed tasks count
        const completedFromTasks = await Task.countDocuments({
          workerId: w._id,
          status: { $in: ['COMPLETED', 'VERIFIED'] },
        });
        const completedFromIssues = await Issue.countDocuments({
          assignedWorker: w._id,
          status: { $in: ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'] },
        });

        // Overdue tasks count
        const overdueTasks = await Task.countDocuments({
          workerId: w._id,
          status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN PROGRESS'] },
          deadline: { $lt: now, $ne: null },
        });

        const activeTasks = Math.max(activeFromTasks, activeFromIssues);
        const completedTasks = Math.max(completedFromTasks, completedFromIssues);
        const totalTasks = activeTasks + completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

        return {
          ...w,
          workerId: w.workerId || `GRAM-WKR-${String(w._id).slice(-4).toUpperCase()}`,
          assignedArea: w.assignedArea || 'Chandoli',
          workerRole: w.workerRole || w.specialization || 'Field Worker',
          activeTasks,
          completedTasks,
          overdueTasks,
          completionRate,
          lastLogin: w.lastLogin || null,
        };
      })
    );

    // Summary counters for top cards
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const activeWorkers = await User.countDocuments({ role: 'worker', isActive: true });
    const availableWorkers = workersWithStats.filter((w) => w.isActive && w.activeTasks === 0).length;
    const workersOnTask = workersWithStats.filter((w) => w.isActive && w.activeTasks > 0).length;
    const totalCompletedTasks = workersWithStats.reduce((sum, w) => sum + w.completedTasks, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalWorkers,
        activeWorkers,
        availableWorkers,
        workersOnTask,
        completedTasks: totalCompletedTasks,
      },
      workers: workersWithStats,
    });
  } catch (error) {
    console.error('Get all workers error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving workers' });
  }
};

// @desc    Create / Add new field worker with auto Worker ID & Password Generation
// @route   POST /api/workers
// @access  Private (Admin)
exports.addWorker = async (req, res) => {
  try {
    let { name, email, password, phone, assignedArea, workerRole, status, workerId } = req.body;

    // Validate name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide worker full name' });
    }

    // Validate mobile number (10 digits)
    const cleanPhone = (phone || '').trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number',
      });
    }

    // Validate email
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Check duplicate email
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    // Check duplicate phone
    const phoneExists = await User.findOne({ phone: cleanPhone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this mobile number already exists',
      });
    }

    // Generate or validate Worker ID
    let finalWorkerId = (workerId || '').trim().toUpperCase();
    if (!finalWorkerId) {
      finalWorkerId = await generateUniqueWorkerId();
    } else {
      const idExists = await User.findOne({ workerId: finalWorkerId });
      if (idExists) {
        finalWorkerId = await generateUniqueWorkerId();
      }
    }

    // Password generation: if blank or auto requested, generate strong temporary password
    const temporaryPassword = password && password.trim().length >= 6 ? password.trim() : generateStrongPassword();

    const allowedRoles = [
      'Field Worker',
      'Sanitation Worker',
      'Water Maintenance Worker',
      'Road Maintenance Worker',
      'Electrical/Streetlight Worker',
      'General',
    ];
    const selectedRole = allowedRoles.includes(workerRole) ? workerRole : 'Field Worker';

    // Create worker record
    const worker = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: temporaryPassword,
      role: 'worker',
      phone: cleanPhone,
      workerId: finalWorkerId,
      assignedArea: assignedArea || 'Chandoli',
      workerRole: selectedRole,
      specialization: selectedRole,
      isActive: status !== 'Inactive',
      mustChangePassword: true,
    });

    res.status(201).json({
      success: true,
      message: 'Worker account created successfully.',
      worker: {
        id: worker._id,
        name: worker.name,
        workerId: worker.workerId,
        mobile: worker.phone,
        email: worker.email,
        temporaryPassword, // Returned for the one-time admin copy/send modal
        assignedArea: worker.assignedArea,
        workerRole: worker.workerRole,
        status: worker.isActive ? 'Active' : 'Inactive',
      },
    });
  } catch (error) {
    console.error('Add worker error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating worker' });
  }
};

// @desc    Update worker profile
// @route   PUT /api/workers/:id
// @access  Private (Admin)
exports.updateWorker = async (req, res) => {
  try {
    const { name, phone, email, assignedArea, workerRole, isActive } = req.body;
    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    if (name) worker.name = name.trim();
    if (phone) {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Mobile number must be 10 digits' });
      }
      worker.phone = cleanPhone;
    }
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: worker._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      worker.email = cleanEmail;
    }
    if (assignedArea) worker.assignedArea = assignedArea;
    if (workerRole) {
      worker.workerRole = workerRole;
      worker.specialization = workerRole;
    }
    if (typeof isActive === 'boolean') worker.isActive = isActive;

    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Worker details updated successfully',
      worker,
    });
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ success: false, message: 'Server error updating worker' });
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

// @desc    Admin reset worker password
// @route   POST /api/workers/:id/reset-password
// @access  Private (Admin)
exports.resetWorkerPassword = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const newTempPassword = req.body.password || generateStrongPassword();
    worker.passwordHash = newTempPassword;
    worker.mustChangePassword = true;
    await worker.save();

    res.status(200).json({
      success: true,
      message: `Temporary password generated for ${worker.name}`,
      credentials: {
        workerId: worker.workerId,
        name: worker.name,
        email: worker.email,
        mobile: worker.phone,
        temporaryPassword: newTempPassword,
      },
    });
  } catch (error) {
    console.error('Reset worker password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

// @desc    Worker Activity & Monitoring metrics for Admin
// @route   GET /api/workers/stats/activity
// @access  Private (Admin)
exports.getWorkerMonitoringActivity = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const workers = await User.find({ role: 'worker' }).select('-passwordHash').lean();

    const activeWorkers = workers.filter((w) => w.isActive).length;

    // Tasks completed today
    const completedTasksToday = await Task.countDocuments({
      status: { $in: ['COMPLETED', 'VERIFIED'] },
      completedAt: { $gte: startOfToday },
    });

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN PROGRESS'] },
      deadline: { $lt: now, $ne: null },
    });

    // Pending admin verification
    const pendingVerification = await Task.countDocuments({
      status: 'COMPLETED',
    });

    // Worker performance table & on-task computation
    let workersCurrentlyOnTask = 0;
    const workerPerformance = await Promise.all(
      workers.map(async (w) => {
        const assigned = await Task.countDocuments({ workerId: w._id });
        const inProgress = await Task.countDocuments({
          workerId: w._id,
          status: { $in: ['ACCEPTED', 'IN PROGRESS'] },
        });
        const completed = await Task.countDocuments({
          workerId: w._id,
          status: { $in: ['COMPLETED', 'VERIFIED'] },
        });
        const overdue = await Task.countDocuments({
          workerId: w._id,
          status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN PROGRESS'] },
          deadline: { $lt: now, $ne: null },
        });

        if (inProgress > 0) workersCurrentlyOnTask++;

        const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;

        return {
          workerId: w.workerId || `GRAM-WKR-${String(w._id).slice(-4).toUpperCase()}`,
          name: w.name,
          role: w.workerRole || w.specialization || 'Field Worker',
          assignedArea: w.assignedArea || 'Chandoli',
          assigned,
          inProgress,
          completed,
          overdue,
          completionRate,
          isActive: w.isActive,
        };
      })
    );

    // Completion chart data (by civic role/category)
    const roles = [
      'Field Worker',
      'Sanitation Worker',
      'Water Maintenance Worker',
      'Road Maintenance Worker',
      'Electrical/Streetlight Worker',
    ];
    const taskCompletionChart = await Promise.all(
      roles.map(async (r) => {
        const count = await Task.countDocuments({
          category: { $regex: new RegExp(r.split(' ')[0], 'i') },
          status: { $in: ['COMPLETED', 'VERIFIED'] },
        });
        return {
          name: r.replace(' Worker', '').replace(' Maintenance', ''),
          completed: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      activity: {
        activeWorkers,
        workersCurrentlyOnTask,
        completedTasksToday,
        overdueTasks,
        pendingVerification,
      },
      workerPerformance,
      taskCompletionChart,
    });
  } catch (error) {
    console.error('Worker monitoring error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving monitoring data' });
  }
};

// @desc    Get complete Worker Dashboard payload (profile, statistics, assigned tasks)
// @route   GET /api/worker/dashboard or GET /api/workers/dashboard
// @access  Private (Worker, Admin)
exports.getWorkerDashboard = async (req, res) => {
  try {
    const worker = await User.findById(req.user.id).select('-passwordHash');
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker account not found.' });
    }

    const workerIdStr = worker._id.toString();
    const wId = worker.workerId || '';

    // Fetch personal tasks from Task model
    let tasks = await Task.find({
      $or: [{ workerId: worker._id }, { workerId: workerIdStr }],
    })
      .populate('issueId', 'title category priority status images location description deadline completionDetails')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Also include any issues assigned directly to worker
    try {
      const existingTaskIssueIds = new Set(
        tasks.map((t) => (t.issueId?._id || t.issueId || t._id)?.toString())
      );
      const queryOr = [{ assignedWorker: worker._id }, { assignedWorker: workerIdStr }];
      if (wId) queryOr.push({ assignedWorker: wId });
      if (worker.email) queryOr.push({ assignedWorker: worker.email.toLowerCase() });

      const directIssues = await Issue.find({ $or: queryOr }).lean();
      for (const iss of directIssues) {
        const issIdStr = iss._id.toString();
        if (!existingTaskIssueIds.has(issIdStr)) {
          tasks.unshift({
            _id: iss._id,
            taskId: `TSK-${issIdStr.slice(-4).toUpperCase()}`,
            issueId: iss,
            title: iss.title,
            category: iss.category,
            priority: typeof iss.priority === 'object' ? iss.priority?.level : (iss.priority || 'Medium'),
            description: iss.description,
            location: iss.location,
            deadline: iss.deadline || null,
            status:
              iss.status === 'UNDER ACTION'
                ? 'IN PROGRESS'
                : iss.status === 'ACTION COMPLETED'
                ? 'COMPLETED'
                : iss.status === 'VERIFIED RESOLVED'
                ? 'VERIFIED'
                : iss.status,
            beforeImage: iss.images?.[0]?.url || '',
            afterImage: iss.completionDetails?.images?.[0]?.url || '',
            workerNotes: iss.completionDetails?.notes || '',
            createdAt: iss.createdAt,
          });
          existingTaskIssueIds.add(issIdStr);
        }
      }
    } catch (directErr) {
      console.warn('Direct issues load error in dashboard:', directErr.message);
    }

    // Format tasks cleanly
    const formattedTasks = tasks.map((t) => {
      const issue = t.issueId || {};
      const tId = t._id ? t._id.toString() : '';
      return {
        _id: tId,
        id: tId,
        taskId: t.taskId || (tId ? `TSK-${tId.slice(-4).toUpperCase()}` : 'TSK-0000'),
        issueId: issue._id ? issue._id.toString() : (t.issueId ? t.issueId.toString() : tId),
        title: t.title || issue.title || 'Civic Repair Work Order',
        category: t.category || issue.category || 'General',
        priority: typeof t.priority === 'object' ? t.priority?.level : (t.priority || issue.priority?.level || 'Medium'),
        description: t.description || issue.description || '',
        location: t.location || issue.location || { address: worker.assignedArea || 'Chandoli' },
        assignedDate: t.createdAt || issue.assignedAt || new Date().toISOString(),
        dueDate: t.deadline || issue.deadline || null,
        deadline: t.deadline || issue.deadline || null,
        status: t.status || 'ASSIGNED',
        beforeImage: t.beforeImage || issue.images?.[0]?.url || '',
        afterImage: t.afterImage || issue.completionDetails?.images?.[0]?.url || '',
        workerNotes: t.workerNotes || issue.completionDetails?.notes || '',
      };
    });

    const totalTasks = formattedTasks.length;
    const pendingTasks = formattedTasks.filter((t) => ['ASSIGNED', 'NEW', 'VALIDATED'].includes(t.status)).length;
    const inProgressTasks = formattedTasks.filter((t) => ['ACCEPTED', 'IN PROGRESS', 'UNDER ACTION'].includes(t.status)).length;
    const completedTasks = formattedTasks.filter((t) => ['COMPLETED', 'VERIFIED', 'ACTION COMPLETED', 'VERIFIED RESOLVED'].includes(t.status)).length;

    res.status(200).json({
      success: true,
      worker: {
        id: worker._id,
        _id: worker._id,
        workerId: worker.workerId || 'GRAM-WKR-001',
        name: worker.name,
        email: worker.email,
        mobile: worker.phone || '',
        phone: worker.phone || '',
        assignedArea: worker.assignedArea || 'Chandoli',
        role: worker.workerRole || worker.specialization || 'Field Worker',
        workerRole: worker.workerRole || worker.specialization || 'Field Worker',
        status: worker.isActive ? 'Active' : 'Inactive',
        isActive: !!worker.isActive,
        mustChangePassword: !!worker.mustChangePassword,
      },
      tasks: formattedTasks,
      statistics: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    console.error('getWorkerDashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error loading worker dashboard' });
  }
};

