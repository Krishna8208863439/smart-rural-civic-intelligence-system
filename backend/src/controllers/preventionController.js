const PreventiveAction = require('../models/PreventiveAction');
const Issue = require('../models/Issue');
const RecurrenceProfile = require('../models/RecurrenceProfile');
const PreventiveRecommendationService = require('../services/PreventiveRecommendationService');
const PreventiveEffectivenessService = require('../services/PreventiveEffectivenessService');
const { processUploadedFile } = require('../config/cloudinary');

// @desc    Get recommendations for a category or specific issue
// @route   GET /api/prevention/recommendations
// @access  Private (Admin)
exports.getRecommendations = async (req, res) => {
  try {
    const { category, issueId } = req.query;
    let targetCategory = category || 'Waste accumulation';
    let recurrenceRisk = 50;
    let frequency = 2;
    let probableCauses = [];

    if (issueId) {
      const issue = await Issue.findById(issueId);
      if (issue) {
        targetCategory = issue.category;
        recurrenceRisk = issue.recurrenceRisk;
        frequency = issue.recurrenceFactors?.historicalCount || 2;
        probableCauses = issue.rootCauses || [];
      }
    }

    const recommendations = PreventiveRecommendationService.generate({
      category: targetCategory,
      recurrenceRisk,
      frequency,
      probableCauses,
    });

    res.status(200).json({
      success: true,
      category: targetCategory,
      recommendations,
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving recommendations' });
  }
};

// @desc    Record new preventive action
// @route   POST /api/prevention/action
// @access  Private (Admin)
exports.recordAction = async (req, res) => {
  try {
    const {
      issueId,
      recurrenceProfileId,
      category,
      locationName,
      recommendedAction,
      actionTaken,
      assignedTo,
      targetDate,
      notes,
      beforeFrequency,
    } = req.body;

    if (!category || !recommendedAction) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category and recommended action',
      });
    }

    const action = await PreventiveAction.create({
      issueId: issueId || null,
      recurrenceProfileId: recurrenceProfileId || null,
      category,
      location: {
        name: locationName || 'Gram Panchayat Hotspot',
      },
      recommendedAction,
      actionTaken: actionTaken || recommendedAction,
      assignedTo: assignedTo || null,
      targetDate: targetDate || null,
      status: 'PLANNED',
      beforeFrequency: beforeFrequency ? Number(beforeFrequency) : 5,
      notes: notes || '',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Preventive action plan recorded successfully',
      action,
    });
  } catch (error) {
    console.error('Record action error:', error);
    res.status(500).json({ success: false, message: 'Server error creating preventive action' });
  }
};

// @desc    Update preventive action (status, completion, evidence)
// @route   PUT /api/prevention/action/:id
// @access  Private (Admin or Assigned Worker)
exports.updateAction = async (req, res) => {
  try {
    const { actionTaken, status, notes, completedDate, afterFrequency } = req.body;
    const action = await PreventiveAction.findById(req.params.id);

    if (!action) {
      return res.status(404).json({ success: false, message: 'Preventive action not found' });
    }

    if (actionTaken) action.actionTaken = actionTaken;
    if (notes) action.notes = notes;
    if (status) action.status = status;

    if (status === 'COMPLETED' && !action.completedDate) {
      action.completedDate = completedDate || new Date();
    }

    // Process attached evidence images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await processUploadedFile(file);
        if (uploaded) {
          action.evidence.push({
            url: uploaded.url,
            caption: req.body.caption || 'Preventive intervention proof',
          });
        }
      }
    }

    // If afterFrequency is provided or action is completed, evaluate effectiveness
    if (afterFrequency !== undefined || action.status === 'COMPLETED') {
      const postCount = afterFrequency !== undefined ? Number(afterFrequency) : action.afterFrequency;
      action.afterFrequency = postCount;

      const evalResult = PreventiveEffectivenessService.evaluate({
        beforeFrequency: action.beforeFrequency,
        afterFrequency: postCount,
        daysObserved: 60,
      });

      action.effectivenessScore = evalResult.score;
      action.effectivenessLevel = evalResult.level;
      action.reductionPercentage = evalResult.reductionPercentage;
    }

    await action.save();

    res.status(200).json({
      success: true,
      message: 'Preventive action updated successfully',
      action,
    });
  } catch (error) {
    console.error('Update action error:', error);
    res.status(500).json({ success: false, message: 'Server error updating action' });
  }
};

// @desc    Evaluate or re-evaluate effectiveness of a preventive action
// @route   GET /api/prevention/effectiveness/:id
// @access  Private (Admin)
exports.evaluateEffectiveness = async (req, res) => {
  try {
    const action = await PreventiveAction.findById(req.params.id);
    if (!action) {
      return res.status(404).json({ success: false, message: 'Action not found' });
    }

    const { afterFrequency, daysObserved } = req.query;
    const postCount = afterFrequency !== undefined ? Number(afterFrequency) : action.afterFrequency;

    const evaluation = PreventiveEffectivenessService.evaluate({
      beforeFrequency: action.beforeFrequency,
      afterFrequency: postCount,
      daysObserved: daysObserved ? Number(daysObserved) : 60,
    });

    action.afterFrequency = postCount;
    action.effectivenessScore = evaluation.score;
    action.effectivenessLevel = evaluation.level;
    action.reductionPercentage = evaluation.reductionPercentage;
    await action.save();

    res.status(200).json({
      success: true,
      evaluation,
      action,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error evaluating effectiveness' });
  }
};

// @desc    Get all preventive actions
// @route   GET /api/prevention/actions
// @access  Private (Admin or Worker)
exports.getPreventiveActions = async (req, res) => {
  try {
    const { category, status, effectivenessLevel } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (effectivenessLevel && effectivenessLevel !== 'All') {
      query.effectivenessLevel = effectivenessLevel;
    }

    const actions = await PreventiveAction.find(query)
      .populate('assignedTo', 'name email specialization')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: actions.length,
      actions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving actions' });
  }
};
