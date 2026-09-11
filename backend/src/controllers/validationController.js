const CommunityValidation = require('../models/CommunityValidation');
const Issue = require('../models/Issue');
const IssueHistory = require('../models/IssueHistory');
const Notification = require('../models/Notification');

// @desc    Submit community validation vote
// @route   POST /api/issues/:id/validate
// @access  Private (Citizen or any logged-in user)
exports.validateIssue = async (req, res) => {
  try {
    const { response, comment } = req.body;
    const issueId = req.params.id;

    if (!['CONFIRM', 'STILL_EXISTS', 'RESOLVED'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: "Invalid response type. Must be 'CONFIRM', 'STILL_EXISTS', or 'RESOLVED'.",
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Upsert community validation
    const existing = await CommunityValidation.findOne({
      issueId,
      userId: req.user.id,
    });

    let validation;
    if (existing) {
      existing.response = response;
      existing.comment = comment || existing.comment;
      existing.timestamp = new Date();
      validation = await existing.save();
    } else {
      validation = await CommunityValidation.create({
        issueId,
        userId: req.user.id,
        userName: req.user.name,
        response,
        comment: comment || '',
      });
    }

    // Re-aggregate counts
    const confirms = await CommunityValidation.countDocuments({ issueId, response: 'CONFIRM' });
    const stillExists = await CommunityValidation.countDocuments({ issueId, response: 'STILL_EXISTS' });
    const resolved = await CommunityValidation.countDocuments({ issueId, response: 'RESOLVED' });

    issue.communityValidationStats = {
      confirms,
      stillExists,
      resolved,
    };

    // If community confirms issue, boost reliability
    if (response === 'CONFIRM') {
      issue.reliabilityScore = Math.min(100, issue.reliabilityScore + 5);
      issue.reliabilityLevel =
        issue.reliabilityScore >= 81 ? 'Very High' : issue.reliabilityScore >= 61 ? 'High' : 'Medium';
    }

    // If citizen indicates issue still exists during MONITORING or ACTION COMPLETED
    if (response === 'STILL_EXISTS' && ['MONITORING', 'ACTION COMPLETED'].includes(issue.status)) {
      if (stillExists >= 2) {
        const prev = issue.status;
        issue.status = 'REOPENED';
        issue.recurrenceRisk = Math.min(100, issue.recurrenceRisk + 20);
        issue.recurrenceLevel = issue.recurrenceRisk >= 80 ? 'Very High' : 'High';

        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'REOPENED',
          previousState: prev,
          newState: 'REOPENED',
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Reopened following ${stillExists} citizen reports that civic issue still persists.`,
        });

        // Notify Admins
        await Notification.create({
          roleTarget: 'admin',
          type: 'ISSUE_REOPENED',
          title: `Issue Reopened by Citizens: ${issue.title}`,
          message: `Multiple citizens reported that the problem persists after action was taken.`,
          issueId: issue._id,
        });
      }
    } else if (response === 'RESOLVED' && issue.status === 'MONITORING') {
      if (resolved >= 2) {
        const prev = issue.status;
        issue.status = 'VERIFIED RESOLVED';
        issue.resolvedAt = new Date();
        issue.verifiedAt = new Date();

        await IssueHistory.create({
          issueId: issue._id,
          eventType: 'RESOLUTION_VERIFIED',
          previousState: prev,
          newState: 'VERIFIED RESOLVED',
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          comment: `Verified resolved by ${resolved} community citizens.`,
        });
      }
    }

    await issue.save();

    // Record validation event
    await IssueHistory.create({
      issueId: issue._id,
      eventType: 'COMMUNITY_VALIDATED',
      previousState: issue.status,
      newState: issue.status,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment: `Citizen community response submitted: ${response}. ${comment ? `Note: "${comment}"` : ''}`,
      metadata: {
        response,
        comment: comment || '',
        confirms: issue.communityValidationStats?.confirms,
        stillExists: issue.communityValidationStats?.stillExists,
        resolved: issue.communityValidationStats?.resolved,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Community validation registered successfully',
      validation,
      stats: issue.communityValidationStats,
      currentStatus: issue.status,
    });
  } catch (error) {
    console.error('Validate issue error:', error);
    res.status(500).json({ success: false, message: 'Server error during community validation' });
  }
};

// @desc    Get validations for issue
// @route   GET /api/issues/:id/validations
// @access  Public / Private
exports.getIssueValidations = async (req, res) => {
  try {
    const validations = await CommunityValidation.find({ issueId: req.params.id })
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({
      success: true,
      validations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving validations' });
  }
};
