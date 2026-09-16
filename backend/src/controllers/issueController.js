const Issue = require('../models/Issue');
const User = require('../models/User');
const Evidence = require('../models/Evidence');
const IssueHistory = require('../models/IssueHistory');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const PriorityService = require('../services/PriorityService');
const EvidenceReliabilityService = require('../services/EvidenceReliabilityService');
const RecurrenceEngine = require('../services/RecurrenceEngine');
const RootCauseService = require('../services/RootCauseService');
const PreventiveRecommendationService = require('../services/PreventiveRecommendationService');
const { processUploadedFile } = require('../config/cloudinary');

// AI Detection Catalog & Classifier
const detectIssueAi = (text, filename = '', sampleType = '') => {
  let targetText = (text || '').toLowerCase();
  let fname = (filename || '').toLowerCase();
  let sample = (sampleType || '').toLowerCase();
  let combined = `${targetText} ${fname} ${sample}`;

  const catalog = {
    'Drainage blockage': {
      keywords: ['drain', 'drainage', 'gutter', 'culvert', 'nala', 'nali', 'sewage', 'clog', 'block', 'overflow', 'stagnant', 'waterlog', 'सांडपाणी', 'नाले', 'नाली', 'गटार', 'तुंबला'],
      title: 'Severe Drainage Blockage with Overflowing Water',
      description: 'Visual analysis indicates heavy accumulation of silt, organic debris, and plastic waste causing severe obstruction in the village drainage culvert. Stagnant dirty water is overflowing onto the street, posing an immediate public hygiene risk.',
      severity: 'High',
      rootCause: 'Culvert debris accumulation and lack of periodic desilting',
      preventiveAction: 'Install debris filtration grate at culvert mouth and schedule monthly silt clearance',
      confidence: 94,
      tags: ['culvert', 'overflow', 'stagnant_water', 'sanitation_risk'],
    },
    'Waste accumulation': {
      keywords: ['waste', 'garbage', 'trash', 'kachra', 'dump', 'plastic', 'litter', 'rubbish', 'solid waste', 'कचरा', 'घाण'],
      title: 'Open Solid Waste Accumulation and Garbage Dump',
      description: 'Visual analysis detects an unauthorized open dump of mixed solid waste, non-biodegradable plastics, and discarded packaging. The pile attracts stray animals and generates foul odors near the residential area.',
      severity: 'Medium',
      rootCause: 'Lack of designated village community dustbin and door-to-door waste collection frequency',
      preventiveAction: 'Deploy covered community waste collection bins and establish a scheduled bi-weekly tractor collection route',
      confidence: 92,
      tags: ['garbage_dump', 'plastic_waste', 'odor', 'stray_animals'],
    },
    'Water leakage': {
      keywords: ['leak', 'pipeline', 'pipe', 'burst', 'water leak', 'pressure', 'valve', 'main line', 'गळती', 'पाईप', 'नल', 'फूट'],
      title: 'Major Drinking Water Pipeline Fracture and Leakage',
      description: 'Visual analysis detects pressurized clean potable water gushing from a damaged subterranean pipeline or faulty joint valve. Substantial volume of clean water is being wasted and weakening the adjoining road foundation.',
      severity: 'High',
      rootCause: 'Pipe joint degradation under vehicular pressure and aged GI/PVC pipe material',
      preventiveAction: 'Replace cracked line section with reinforced HDPE piping and fit pressure-regulating air-release valves',
      confidence: 96,
      tags: ['water_loss', 'pipeline_rupture', 'clean_water', 'pressure_leak'],
    },
    'Damaged road': {
      keywords: ['road', 'pothole', 'crack', 'asphalt', 'tar', 'crater', 'rasta', 'gravel', 'erosion', 'pavement', 'रस्ता', 'खड्डे', 'सड़क', 'गड्ढे'],
      title: 'Severe Road Surface Potholes and Asphalt Degradation',
      description: 'Visual analysis reveals extensive asphalt wear, multiple interconnected potholes, and loose stone aggregate across the primary village transit route. The road defect creates hazardous commuting conditions for two-wheelers and tractors.',
      severity: 'High',
      rootCause: 'Monsoon water logging, inadequate sub-base compaction, and heavy agricultural vehicular transit',
      preventiveAction: 'Implement cold-mix bitumen patching followed by asphalt resurfacing and road shoulder drainage channels',
      confidence: 95,
      tags: ['potholes', 'asphalt_crack', 'traffic_hazard', 'road_safety'],
    },
    'Streetlight failure': {
      keywords: ['street light', 'streetlight', 'light', 'lamp', 'bulb', 'dark', 'pole', 'electric', 'illumination', 'night', 'बत्ती', 'दिवा', 'अंधार'],
      title: 'Panchayat Streetlight Fixture Failure and Dark Corridor',
      description: 'Visual inspection shows non-functional street lamp luminaire / faulty automatic daylight sensor on the village main pole. The sector remains in complete darkness at night, impacting safety and pedestrian transit.',
      severity: 'Medium',
      rootCause: 'Blown LED driver circuitry, voltage surge, or degraded photocell daylight sensor',
      preventiveAction: 'Install surge-protected energy-efficient 45W LED streetlight fixtures with automated digital timer switches',
      confidence: 91,
      tags: ['dark_zone', 'led_driver', 'lighting_pole', 'night_safety'],
    },
    'Water supply': {
      keywords: ['borewell', 'tap', 'handpump', 'tank', 'motor', 'pump', 'water shortage', 'dry', 'drinking water', 'पाणी पुरवठा', 'जल'],
      title: 'Community Water Tank & Borewell Pump Supply Disruption',
      description: 'Ground evidence shows disrupted water flow from the village overhead storage tank or public tap stand. Citizens are facing acute shortage of daily potable water for domestic use.',
      severity: 'Critical',
      rootCause: 'Submersible pump motor stator burn-out or low village groundwater level',
      preventiveAction: 'Perform motor rewinding, install phase-failure protective relay, and conduct groundwater recharge check',
      confidence: 93,
      tags: ['water_crisis', 'borewell', 'pump_failure', 'public_tap'],
    },
    'Sanitation': {
      keywords: ['toilet', 'septic', 'washroom', 'latrine', 'drain', 'smell', 'hygiene', 'filth', 'दुर्गंधी', 'शौचालय'],
      title: 'Public Community Toilet Septic Tank Overflow',
      description: 'Visual evidence indicates full septic pit backing up into public toilet cubicles, creating unsanitary conditions and foul stench. Immediate suction tanker servicing is needed.',
      severity: 'Critical',
      rootCause: 'Septic containment chamber capacity saturation and block in soakage pit',
      preventiveAction: 'Engage mechanical suction desludging and treat drainage chamber with bio-digestive enzymes',
      confidence: 95,
      tags: ['sanitation', 'septic_overflow', 'hygiene_alert'],
    },
  };

  let matchedCategory = 'Drainage blockage';
  let maxMatches = 0;

  for (const [catName, catData] of Object.entries(catalog)) {
    let count = 0;
    for (const kw of catData.keywords) {
      if (combined.includes(kw)) {
        count++;
      }
    }
    if (count > maxMatches) {
      maxMatches = count;
      matchedCategory = catName;
    }
  }

  if (maxMatches === 0) {
    if (sample.includes('road')) matchedCategory = 'Damaged road';
    else if (sample.includes('waste')) matchedCategory = 'Waste accumulation';
    else if (sample.includes('water')) matchedCategory = 'Water leakage';
    else if (sample.includes('light')) matchedCategory = 'Streetlight failure';
    else if (sample.includes('supply')) matchedCategory = 'Water supply';
    else if (sample.includes('toilet') || sample.includes('sanitation')) matchedCategory = 'Sanitation';
    else matchedCategory = 'Drainage blockage';
  }

  const result = catalog[matchedCategory];
  return {
    category: matchedCategory,
    ...result,
  };
};

// @desc    Create new civic issue
// @route   POST /api/issues
// @access  Private (Citizen or Admin)
exports.createIssue = async (req, res) => {
  try {
    let {
      title,
      description,
      category,
      severity,
      longitude,
      latitude,
      address,
      landmark,
      ward,
      voiceTranscript,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and description',
      });
    }

    // Run AI Issue Detection to classify/verify category and enrich intelligence
    const firstFilename = (req.files && req.files[0]?.originalname) || '';
    const aiAnalysis = detectIssueAi(`${title} ${description}`, firstFilename, '');

    if (!category || category === 'Other') {
      category = aiAnalysis.category;
    }
    if (!severity) {
      severity = aiAnalysis.severity;
    }

    // Parse coordinates
    let lng = parseFloat(longitude);
    let lat = parseFloat(latitude);
    if (isNaN(lng) || isNaN(lat)) {
      // Default to village center if not provided
      lng = 73.8567;
      lat = 18.5204;
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await processUploadedFile(file);
        if (uploaded) {
          images.push(uploaded);
        }
      }
    } else if (req.body.imageUrl) {
      images.push({ url: req.body.imageUrl });
    }

    // 1. Fetch nearby historical issues in same category for geospatial analysis
    const historicalIssues = await Issue.find({
      category,
      'location.coordinates': { $exists: true },
    }).lean();

    // 2. Evaluate Evidence Reliability
    const reliabilityAssessment = EvidenceReliabilityService.evaluate({
      images,
      location: {
        coordinates: [lng, lat],
        address: address || '',
        landmark: landmark || '',
      },
      description,
      nearbyIssues: historicalIssues,
      communityConfirms: 0,
    });

    // 3. Evaluate Recurrence Risk
    const recurrenceAnalysis = RecurrenceEngine.analyze(
      {
        category,
        location: { coordinates: [lng, lat] },
        createdAt: new Date(),
      },
      historicalIssues
    );

    // 4. Calculate Priority
    const priorityAssessment = PriorityService.calculate({
      severity: severity || 'Medium',
      reportCount: recurrenceAnalysis.historicalCount + 1,
      createdAt: new Date(),
      landmark: `${landmark || ''} ${address || ''}`,
      category,
      communityConfirms: 0,
    });

    // 5. Generate Probable Root Causes
    const rootCauses = RootCauseService.generate({
      category,
      frequency: recurrenceAnalysis.historicalCount + 1,
      seasonalPattern: recurrenceAnalysis.seasonalPattern,
      recurrenceRisk: recurrenceAnalysis.recurrenceRisk,
      landmark: landmark || '',
    });

    // 6. Generate Preventive Recommendations
    const preventiveRecommendations = PreventiveRecommendationService.generate({
      category,
      recurrenceRisk: recurrenceAnalysis.recurrenceRisk,
      frequency: recurrenceAnalysis.historicalCount + 1,
      probableCauses: rootCauses,
    });

    // Initial Status depends on Adaptive Verification Path
    let initialStatus = 'NEW';
    if (reliabilityAssessment.adaptiveVerificationPath === 'auto_validated') {
      initialStatus = 'VALIDATED';
    }

    // Create Issue Document
    const issue = await Issue.create({
      title,
      description,
      category,
      severity: severity || 'Medium',
      images,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        address: address || 'Gram Panchayat Chandoli',
        landmark: landmark || '',
        village: req.user.village || 'Gram Panchayat Chandoli',
        ward: ward || 'Ward 1',
      },
      status: initialStatus,
      priority: priorityAssessment,
      createdBy: req.user.id,
      reliabilityScore: reliabilityAssessment.score,
      reliabilityLevel: reliabilityAssessment.level,
      reliabilityFactors: reliabilityAssessment.factors,
      adaptiveVerificationPath: reliabilityAssessment.adaptiveVerificationPath,
      recurrenceRisk: recurrenceAnalysis.recurrenceRisk,
      recurrenceLevel: recurrenceAnalysis.recurrenceLevel,
      recurrenceFactors: {
        historicalCount: recurrenceAnalysis.historicalCount,
        averageIntervalDays: recurrenceAnalysis.averageIntervalDays,
        seasonalPattern: recurrenceAnalysis.seasonalPattern,
        resolutionStability: recurrenceAnalysis.resolutionStability,
        summary: recurrenceAnalysis.summary,
      },
      rootCauses,
      preventiveRecommendations,
      voiceTranscript: voiceTranscript || '',
      aiDetection: {
        detectedCategory: aiAnalysis.category,
        confidence: aiAnalysis.confidence,
        tags: aiAnalysis.tags,
        rootCause: aiAnalysis.rootCause,
        preventiveAction: aiAnalysis.preventiveAction,
        autoPopulated: true,
      },
    });

    // Store Initial Evidence
    if (images.length > 0) {
      await Evidence.create({
        issueId: issue._id,
        sourceUser: req.user.id,
        evidenceType: 'initial_report',
        media: images.map((img) => ({ url: img.url, caption: 'Initial citizen photo' })),
        reliabilityScore: reliabilityAssessment.score,
      });
    }

    // Record Issue History Log
    await IssueHistory.create({
      issueId: issue._id,
      eventType: 'CREATED',
      previousState: '',
      newState: initialStatus,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Issue registered with ${reliabilityAssessment.level} reliability (${reliabilityAssessment.score}/100) and ${priorityAssessment.level} priority.`,
      metadata: {
        initialStatus,
        reliabilityLevel: reliabilityAssessment.level,
        priorityLevel: priorityAssessment.level,
        recurrenceLevel: recurrenceAnalysis.recurrenceLevel,
      },
    });

    // Notify Admins
    await Notification.create({
      roleTarget: 'admin',
      type: 'ISSUE_CREATED',
      title: `New Civic Issue: ${title}`,
      message: `${req.user.name} reported a ${category} issue at ${landmark || address || 'village'}. Priority: ${priorityAssessment.level}.`,
      issueId: issue._id,
    });

    // If critical priority or high recurrence, broadcast alert
    if (priorityAssessment.level === 'Critical' || recurrenceAnalysis.recurrenceLevel === 'Very High') {
      await Notification.create({
        roleTarget: 'admin',
        type: 'CRITICAL_ALERT',
        title: `CRITICAL ALERT: ${title}`,
        message: `High risk problem detected: Priority ${priorityAssessment.level}, Recurrence Risk ${recurrenceAnalysis.recurrenceLevel}. Immediate review required.`,
        issueId: issue._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Civic issue successfully registered and processed by SRCI intelligence engines.',
      issue,
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating issue',
    });
  }
};

// @desc    Get all issues with filters
// @route   GET /api/issues
// @access  Public / Private
exports.getIssues = async (req, res) => {
  try {
    const {
      category,
      status,
      priority,
      recurrenceLevel,
      reliabilityLevel,
      search,
      mine,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query['priority.level'] = priority;
    if (recurrenceLevel && recurrenceLevel !== 'All') query.recurrenceLevel = recurrenceLevel;
    if (reliabilityLevel && reliabilityLevel !== 'All') query.reliabilityLevel = reliabilityLevel;

    if (mine === 'true' && req.user) {
      if (req.user.role === 'worker') {
        query.assignedWorker = req.user.id;
      } else {
        query.createdBy = req.user.id;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.landmark': { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy === 'priority' ? 'priority.score' : sortBy;

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('createdBy', 'name email village')
      .populate('assignedWorker', 'name email specialization phone')
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: issues.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      issues,
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving issues' });
  }
};

// @desc    Get single issue by ID
// @route   GET /api/issues/:id
// @access  Public / Private
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('createdBy', 'name email village phone')
      .populate('assignedWorker', 'name email specialization phone')
      .populate('adminVerification.verifiedBy', 'name email role');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Also fetch associated history & evidence
    const history = await IssueHistory.find({ issueId: issue._id })
      .sort({ timestamp: -1 })
      .lean();

    const evidence = await Evidence.find({ issueId: issue._id })
      .populate('sourceUser', 'name role')
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({
      success: true,
      issue,
      history,
      evidence,
    });
  } catch (error) {
    console.error('Get issue by id error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving issue' });
  }
};

// @desc    Update issue status (Lifecycle Engine)
// @route   PUT /api/issues/:id/status
// @access  Private (Admin or Worker)
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const previousState = issue.status;
    issue.status = status;

    if (status === 'VERIFIED RESOLVED') {
      issue.resolvedAt = new Date();
      issue.verifiedAt = new Date();
    } else if (status === 'ACTION COMPLETED') {
      issue.resolvedAt = new Date();
    } else if (status === 'REOPENED') {
      // If reopened, increase recurrence statistics
      issue.recurrenceRisk = Math.min(100, issue.recurrenceRisk + 15);
      issue.recurrenceLevel =
        issue.recurrenceRisk >= 80 ? 'Very High' : issue.recurrenceRisk >= 60 ? 'High' : 'Medium';
    }

    await issue.save();

    // Record in History Audit Trail
    await IssueHistory.create({
      issueId: issue._id,
      eventType: status === 'REOPENED' ? 'REOPENED' : 'STATUS_CHANGE',
      previousState,
      newState: status,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: comment || `Status transitioned from ${previousState} to ${status}.`,
      metadata: {
        previousState,
        newState: status,
        comment: comment || '',
      },
    });

    // Notify citizen who created the issue
    await Notification.create({
      userId: issue.createdBy,
      roleTarget: 'citizen',
      type: 'STATUS_UPDATED',
      title: `Status Update: ${issue.title}`,
      message: `Your reported issue is now marked as "${status}". ${comment || ''}`,
      issueId: issue._id,
    });

    res.status(200).json({
      success: true,
      message: `Issue status successfully updated to ${status}`,
      issue,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// @desc    Assign worker to issue (Supports AI Auto-Dispatch based on Category)
// @route   PUT /api/admin/assign-worker/:id
// @access  Private (Admin only)
exports.assignWorker = async (req, res) => {
  try {
    let { workerId, notes } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // AI Auto-Select Worker based on Category if auto requested or workerId not specified
    if (!workerId || workerId === 'auto') {
      const allWorkers = await User.find({ role: 'worker', isActive: true });
      const cat = (issue.category || '').toLowerCase();

      let matchedWorker = allWorkers.find((w) => {
        const spec = (w.specialization || '').toLowerCase();
        if (cat.includes('water') || cat.includes('leak') || cat.includes('pipeline') || cat.includes('pump')) {
          return spec.includes('water') || spec.includes('phe');
        }
        if (cat.includes('waste') || cat.includes('sanitation') || cat.includes('drain') || cat.includes('garbage')) {
          return spec.includes('sanitation') || spec.includes('waste');
        }
        if (cat.includes('road') || cat.includes('street') || cat.includes('light') || cat.includes('pothole') || cat.includes('civil')) {
          return spec.includes('road') || spec.includes('work') || spec.includes('civil');
        }
        return false;
      });

      workerId = (matchedWorker || allWorkers[0])?._id;
      if (!notes) notes = `AI Auto-Dispatched based on category match (${issue.category})`;
    }

    const previousState = issue.status;
    issue.assignedWorker = workerId;
    issue.assignedAt = new Date();
    if (['NEW', 'VALIDATED'].includes(issue.status)) {
      issue.status = 'ASSIGNED';
    }

    await issue.save();

    const assignedUser = await User.findById(workerId).select('name specialization phone');
    const workerName = assignedUser?.name || 'Field Specialist';

    await IssueHistory.create({
      issueId: issue._id,
      eventType: 'WORKER_ASSIGNED',
      previousState,
      newState: issue.status,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Dispatched to ${workerName} (${assignedUser?.specialization || 'Field Worker'}). ${notes || ''}`,
      metadata: {
        workerId,
        workerName,
        specialization: assignedUser?.specialization,
        notes: notes || '',
      },
    });

    // Ensure Task record is created or updated for worker task queue
    try {
      await Task.findOneAndUpdate(
        { issueId: issue._id },
        {
          workerId,
          issueId: issue._id,
          title: issue.title,
          category: issue.category,
          priority: issue.priority?.level || 'Medium',
          description: issue.description,
          location: issue.location,
          status: 'ASSIGNED',
          assignedBy: req.user.id,
          assignedAt: new Date(),
          beforeImage: issue.images?.[0]?.url || '',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (taskErr) {
      console.warn('Task upsert note:', taskErr.message);
    }

    // Notify Worker
    await Notification.create({
      userId: workerId,
      roleTarget: 'worker',
      type: 'WORKER_ASSIGNED',
      title: `New Task Assigned: ${issue.title}`,
      message: `You have been assigned to resolve a ${issue.category} problem at ${issue.location.landmark || issue.location.address}.`,
      issueId: issue._id,
    });

    res.status(200).json({
      success: true,
      message: 'Worker assigned successfully',
      issue,
    });
  } catch (error) {
    console.error('Assign worker error:', error);
    res.status(500).json({ success: false, message: 'Server error assigning worker' });
  }
};

// @desc    Add additional evidence
// @route   POST /api/issues/:id/evidence
// @access  Private
exports.addEvidence = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await processUploadedFile(file);
        if (uploaded) {
          media.push({
            url: uploaded.url,
            caption: req.body.caption || 'Citizen supplemental evidence',
          });
        }
      }
    }

    const evidence = await Evidence.create({
      issueId: issue._id,
      sourceUser: req.user.id,
      evidenceType: req.user.role === 'worker' ? 'worker_progress' : 'additional_citizen',
      media,
      reliabilityScore: 85,
    });

    // Re-evaluate reliability with extra evidence
    issue.reliabilityScore = Math.min(100, issue.reliabilityScore + 10);
    issue.reliabilityLevel =
      issue.reliabilityScore >= 81
        ? 'Very High'
        : issue.reliabilityScore >= 61
        ? 'High'
        : 'Medium';

    await issue.save();

    await IssueHistory.create({
      issueId: issue._id,
      eventType: 'EVIDENCE_ADDED',
      previousState: issue.status,
      newState: issue.status,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Additional photographic evidence attached (${media.length} image(s)). ${req.body.caption || ''}`,
      metadata: {
        images: media.map((m) => m.url),
        caption: req.body.caption || '',
        count: media.length,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Evidence successfully attached',
      evidence,
      issue,
    });
  } catch (error) {
    console.error('Add evidence error:', error);
    res.status(500).json({ success: false, message: 'Server error adding evidence' });
  }
};

// @desc    Get issue history
// @route   GET /api/issues/:id/history
// @access  Public / Private
exports.getIssueHistory = async (req, res) => {
  try {
    const history = await IssueHistory.find({ issueId: req.params.id })
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving history' });
  }
};

// @desc    Admin reviews worker resolution proof & publishes to citizen
// @route   PUT /api/issues/:id/admin-verify
// @access  Private (Admin only)
exports.adminVerifyResolution = async (req, res) => {
  try {
    const { notes } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const previousState = issue.status;
    issue.status = 'VERIFIED RESOLVED';
    issue.verifiedAt = new Date();
    if (!issue.resolvedAt) {
      issue.resolvedAt = new Date();
    }

    issue.adminVerification = {
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      notes: notes || 'Admin verified field worker resolution evidence and published to citizen.',
      forwardedToCitizen: true,
    };

    await issue.save();

    // Record in History Audit Trail
    await IssueHistory.create({
      issueId: issue._id,
      eventType: 'RESOLUTION_VERIFIED',
      previousState,
      newState: 'VERIFIED RESOLVED',
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Resolution verified and published to citizen. Admin Notes: "${notes || 'Verified by Panchayat Administration'}"`,
      metadata: {
        notes: notes || 'Verified by Panchayat Administration',
        verifiedAt: issue.adminVerification.verifiedAt,
        forwardedToCitizen: true,
        resolutionImages: issue.completionDetails?.images?.map((i) => i.url) || [],
      },
    });

    // Notify Citizen who reported the issue
    await Notification.create({
      userId: issue.createdBy,
      roleTarget: 'citizen',
      type: 'VERIFICATION_REQUIRED',
      title: `Resolution Verified: ${issue.title}`,
      message: `Panchayat Administration has verified the resolution proof image for your reported issue. Please review the after-photo and submit your feedback.`,
      issueId: issue._id,
    });

    // If there is an assigned worker, notify them of approval
    if (issue.assignedWorker) {
      await Notification.create({
        userId: issue.assignedWorker,
        roleTarget: 'worker',
        type: 'STATUS_UPDATED',
        title: `Work Approved: ${issue.title}`,
        message: `Admin approved your resolution proof for issue #${issue._id.toString().slice(-6)}.`,
        issueId: issue._id,
      });
    }

    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email village phone')
      .populate('assignedWorker', 'name email specialization phone')
      .populate('adminVerification.verifiedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Resolution proof successfully verified and forwarded to citizen',
      issue: populatedIssue,
    });
  } catch (error) {
    console.error('Admin verify resolution error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying resolution' });
  }
};

// @desc    Citizen submits satisfaction rating & feedback on resolved issue
// @route   POST /api/issues/:id/feedback
// @access  Private (Citizen / Authenticated)
exports.submitCitizenFeedback = async (req, res) => {
  try {
    const { rating, satisfied, comment, reopen } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const parsedRating = Number(rating) || 5;
    const isSatisfied = satisfied === undefined ? true : Boolean(satisfied);

    issue.citizenFeedback = {
      rating: Math.max(1, Math.min(5, parsedRating)),
      satisfied: isSatisfied,
      comment: comment || '',
      submittedAt: new Date(),
    };

    const previousState = issue.status;

    // If citizen marked not satisfied and requested reopen
    if (!isSatisfied && reopen) {
      issue.status = 'REOPENED';
      issue.recurrenceRisk = Math.min(100, issue.recurrenceRisk + 15);
      issue.recurrenceLevel =
        issue.recurrenceRisk >= 80 ? 'Very High' : issue.recurrenceRisk >= 60 ? 'High' : 'Medium';
    }

    await issue.save();

    // Record in History
    await IssueHistory.create({
      issueId: issue._id,
      eventType: !isSatisfied && reopen ? 'REOPENED' : 'CITIZEN_FEEDBACK',
      previousState,
      newState: issue.status,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Citizen feedback: ${parsedRating}/5 Stars (${isSatisfied ? 'Satisfied' : 'Unsatisfied'}). Remarks: "${comment || 'None'}"`,
      metadata: {
        rating: parsedRating,
        satisfied: isSatisfied,
        comment: comment || '',
        reopen: Boolean(!isSatisfied && reopen),
        submittedAt: new Date(),
      },
    });

    // Notify Admin
    await Notification.create({
      roleTarget: 'admin',
      type: !isSatisfied && reopen ? 'ISSUE_REOPENED' : 'STATUS_UPDATED',
      title: `Citizen Feedback: ${issue.title}`,
      message: `${req.user.name} rated resolution ${parsedRating}/5 stars: "${comment || ''}"`,
      issueId: issue._id,
    });

    // Notify Worker
    if (issue.assignedWorker) {
      await Notification.create({
        userId: issue.assignedWorker,
        roleTarget: 'worker',
        type: 'STATUS_UPDATED',
        title: `Citizen Feedback Received: ${issue.title}`,
        message: `Citizen gave ${parsedRating}/5 stars for your completed task.`,
        issueId: issue._id,
      });
    }

    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email village phone')
      .populate('assignedWorker', 'name email specialization phone')
      .populate('adminVerification.verifiedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      issue: populatedIssue,
    });
  } catch (error) {
    console.error('Submit citizen feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error saving feedback' });
  }
};

// @desc    Automatic AI Issue Detection from Photo or Text
// @route   POST /api/issues/ai-detect
// @access  Public / Private
exports.aiDetectIssue = async (req, res) => {
  try {
    const file = req.file;
    const { text, sampleType } = req.body;

    const result = detectIssueAi(text, file?.originalname, sampleType);

    res.status(200).json({
      success: true,
      ...result,
      message: `AI successfully analyzed and detected: ${result.category} (${result.confidence}% confidence)`,
    });
  } catch (error) {
    console.error('AI detect issue error:', error);
    res.status(500).json({ success: false, message: 'Server error during AI detection' });
  }
};

// @desc    Update Issue Location with Accurate Live Pin
// @route   PUT /api/issues/:id/location
// @access  Private
exports.updateIssueLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, landmark, timing, accuracy, detectedAt } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.location.coordinates = [lng, lat];
    if (address) issue.location.address = address;
    if (landmark) issue.location.landmark = landmark;
    if (timing) issue.location.timing = timing;
    if (accuracy) issue.location.accuracy = accuracy;
    if (detectedAt) issue.location.detectedAt = detectedAt;

    await issue.save();

    const timingInfo = timing ? ` at ${timing}` : '';
    await IssueHistory.create({
      issueId: issue._id,
      eventType: 'LOCATION_UPDATED',
      previousState: issue.status,
      newState: issue.status,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Accurate live GPS pin updated to [${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E]${timingInfo} by ${req.user.name}.`,
      metadata: { latitude: lat, longitude: lng, timing, accuracy },
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email village phone')
      .populate('assignedWorker', 'name email specialization phone')
      .populate('adminVerification.verifiedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Accurate live pin location updated successfully',
      issue: populatedIssue,
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating location' });
  }
};

