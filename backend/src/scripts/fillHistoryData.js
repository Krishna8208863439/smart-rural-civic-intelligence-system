const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Issue = require('../models/Issue');
const IssueHistory = require('../models/IssueHistory');
const User = require('../models/User');

const fillHistoryData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srci_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    const admin = await User.findOne({ role: 'admin' });
    const workers = await User.find({ role: 'worker' });
    const citizens = await User.find({ role: 'citizen' });

    const issues = await Issue.find();
    console.log(`Analyzing history for ${issues.length} issues...`);

    let totalCreated = 0;

    for (const issue of issues) {
      const existingEvents = await IssueHistory.find({ issueId: issue._id });
      const eventTypes = new Set(existingEvents.map((e) => e.eventType));

      const reporter = issue.createdBy ? await User.findById(issue.createdBy) : citizens[0];
      const worker = issue.assignedWorker ? await User.findById(issue.assignedWorker) : workers[0];
      const adminUser = admin || { _id: null, name: 'Dr. Anand Deshmukh (Gram Sevak)', role: 'admin' };

      const baseTime = new Date(issue.createdAt || Date.now());

      // 1. CREATED
      if (!eventTypes.has('CREATED')) {
        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'CREATED',
          previousState: '',
          newState: 'NEW',
          userId: reporter?._id,
          userName: reporter?.name || 'Aarav Kumar',
          userRole: 'citizen',
          comment: `Issue registered with ${issue.reliabilityLevel || 'High'} reliability (${issue.reliabilityScore || 80}/100) and ${issue.priority?.level || 'Medium'} priority.`,
          metadata: {
            category: issue.category,
            landmark: issue.location?.landmark,
            reliabilityScore: issue.reliabilityScore,
            priorityScore: issue.priority?.score,
          },
          timestamp: baseTime,
        });
        totalCreated++;
      }

      // 2. COMMUNITY_VALIDATED (if status is VALIDATED, ASSIGNED, UNDER ACTION, ACTION COMPLETED, MONITORING, VERIFIED RESOLVED, REOPENED)
      if (
        !eventTypes.has('COMMUNITY_VALIDATED') &&
        issue.status !== 'NEW'
      ) {
        const valTime = new Date(baseTime.getTime() + 15 * 60 * 1000);
        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'COMMUNITY_VALIDATED',
          previousState: 'NEW',
          newState: 'VALIDATED',
          userId: citizens[1]?._id || reporter?._id,
          userName: citizens[1]?.name || 'Sunita Gaikwad',
          userRole: 'citizen',
          comment: `Citizen community response submitted: CONFIRM. Note: "Corroborated by local residents at ${issue.location?.landmark || 'village'}."`,
          metadata: {
            response: 'CONFIRM',
            comment: 'Corroborated by local residents',
          },
          timestamp: valTime,
        });
        totalCreated++;
      }

      // 3. WORKER_ASSIGNED (if ASSIGNED, UNDER ACTION, ACTION COMPLETED, MONITORING, VERIFIED RESOLVED)
      if (
        !eventTypes.has('WORKER_ASSIGNED') &&
        ['ASSIGNED', 'UNDER ACTION', 'ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(issue.status)
      ) {
        const assignTime = new Date(baseTime.getTime() + 45 * 60 * 1000);
        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'WORKER_ASSIGNED',
          previousState: 'VALIDATED',
          newState: 'ASSIGNED',
          userId: adminUser._id,
          userName: adminUser.name,
          userRole: 'admin',
          comment: `Dispatched to ${worker?.name || 'Field Specialist'} (${worker?.specialization || 'Public Works'}). AI category match auto-recommended.`,
          metadata: {
            workerId: worker?._id,
            workerName: worker?.name,
            specialization: worker?.specialization,
          },
          timestamp: assignTime,
        });
        totalCreated++;
      }

      // 4. WORK_STARTED & PROGRESS_NOTE (if UNDER ACTION, ACTION COMPLETED, MONITORING, VERIFIED RESOLVED)
      if (
        !eventTypes.has('WORK_STARTED') &&
        ['UNDER ACTION', 'ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(issue.status)
      ) {
        const startTime = new Date(baseTime.getTime() + 90 * 60 * 1000);
        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'WORK_STARTED',
          previousState: 'ASSIGNED',
          newState: 'UNDER ACTION',
          userId: worker?._id,
          userName: worker?.name || 'Field Specialist',
          userRole: 'worker',
          comment: `Worker arrived on-site at ${issue.location?.landmark || 'location'}. Field tools & materials deployed.`,
          metadata: {
            startWork: true,
            note: 'On-site arrival and inspection completed.',
          },
          timestamp: startTime,
        });
        totalCreated++;
      }

      // 5. ACTION_COMPLETED (if ACTION COMPLETED, MONITORING, VERIFIED RESOLVED)
      if (
        !eventTypes.has('ACTION_COMPLETED') &&
        ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(issue.status)
      ) {
        const compTime = new Date(baseTime.getTime() + 180 * 60 * 1000);
        const proofImg = issue.completionDetails?.images?.[0]?.url || 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800';
        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'ACTION_COMPLETED',
          previousState: 'UNDER ACTION',
          newState: 'ACTION COMPLETED',
          userId: worker?._id,
          userName: worker?.name || 'Field Specialist',
          userRole: 'worker',
          comment: `Work solved by ${worker?.name || 'Field Specialist'}. Resolution proof image uploaded for Admin review. Note: ${issue.completionDetails?.notes || 'Repairs completed to standard.'}`,
          metadata: {
            notes: issue.completionDetails?.notes || 'Repairs completed to standard.',
            images: [proofImg],
            completedAt: compTime,
          },
          timestamp: compTime,
        });
        totalCreated++;
      }

      // 6. RESOLUTION_VERIFIED (if VERIFIED RESOLVED)
      if (
        !eventTypes.has('RESOLUTION_VERIFIED') &&
        ['VERIFIED RESOLVED'].includes(issue.status)
      ) {
        const verTime = new Date(baseTime.getTime() + 240 * 60 * 1000);
        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'RESOLUTION_VERIFIED',
          previousState: 'ACTION COMPLETED',
          newState: 'VERIFIED RESOLVED',
          userId: adminUser._id,
          userName: adminUser.name,
          userRole: 'admin',
          comment: `Resolution verified and published to citizen. Admin Notes: "${issue.adminVerification?.notes || 'Inspected on-site by Gram Panchayat. Work approved.'}"`,
          metadata: {
            notes: issue.adminVerification?.notes || 'Inspected on-site by Gram Panchayat. Work approved.',
            verifiedAt: verTime,
            forwardedToCitizen: true,
          },
          timestamp: verTime,
        });
        totalCreated++;
      }

      // 7. CITIZEN_FEEDBACK (if VERIFIED RESOLVED and has feedback or rating)
      if (
        !eventTypes.has('CITIZEN_FEEDBACK') &&
        ['VERIFIED RESOLVED'].includes(issue.status)
      ) {
        const feedTime = new Date(baseTime.getTime() + 300 * 60 * 1000);
        const rating = issue.citizenFeedback?.rating || 5;
        const satisfied = issue.citizenFeedback?.satisfied ?? true;
        const comment = issue.citizenFeedback?.comment || 'Problem solved quickly. Satisfied with repair quality.';
        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'CITIZEN_FEEDBACK',
          previousState: 'VERIFIED RESOLVED',
          newState: 'VERIFIED RESOLVED',
          userId: reporter?._id,
          userName: reporter?.name || 'Aarav Kumar',
          userRole: 'citizen',
          comment: `Citizen feedback: ${rating}/5 Stars (${satisfied ? 'Satisfied' : 'Unsatisfied'}). Remarks: "${comment}"`,
          metadata: {
            rating,
            satisfied,
            comment,
            submittedAt: feedTime,
          },
          timestamp: feedTime,
        });
        totalCreated++;
      }
    }

    console.log(`Successfully filled ${totalCreated} lifecycle history entries across all issues!`);
    process.exit(0);
  } catch (err) {
    console.error('Fill history data error:', err);
    process.exit(1);
  }
};

fillHistoryData();
