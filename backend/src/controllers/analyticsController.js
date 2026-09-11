const Issue = require('../models/Issue');
const RecurrenceProfile = require('../models/RecurrenceProfile');
const PreventiveAction = require('../models/PreventiveAction');
const User = require('../models/User');

// @desc    Get comprehensive Admin & System Dashboard KPIs and charts
// @route   GET /api/admin/dashboard
// @access  Private (Admin or Citizen high level)
exports.getDashboardKPIs = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: { $in: ['NEW', 'VALIDATED'] } });
    const inProgressIssues = await Issue.countDocuments({ status: { $in: ['ASSIGNED', 'UNDER ACTION'] } });
    const monitoringIssues = await Issue.countDocuments({ status: 'MONITORING' });
    const resolvedIssues = await Issue.countDocuments({ status: { $in: ['ACTION COMPLETED', 'VERIFIED RESOLVED'] } });
    const reopenedIssues = await Issue.countDocuments({ status: 'REOPENED' });
    const criticalIssues = await Issue.countDocuments({ 'priority.level': 'Critical' });
    const highRecurrenceIssues = await Issue.countDocuments({ recurrenceLevel: { $in: ['High', 'Very High'] } });

    const totalWorkers = await User.countDocuments({ role: 'worker', isActive: true });
    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const totalPreventiveActions = await PreventiveAction.countDocuments();
    const completedPreventiveActions = await PreventiveAction.countDocuments({ status: 'COMPLETED' });

    // Category distribution
    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Status distribution
    const statusStats = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Priority distribution
    const priorityStats = await Issue.aggregate([
      { $group: { _id: '$priority.level', count: { $sum: 1 } } },
    ]);

    // Recurrence risk distribution
    const recurrenceStats = await Issue.aggregate([
      { $group: { _id: '$recurrenceLevel', count: { $sum: 1 } } },
    ]);

    // Monthly reporting trends (past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrends = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          reported: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['ACTION COMPLETED', 'VERIFIED RESOLVED']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrends = monthlyTrends.map((t) => ({
      month: `${monthNames[t._id.month - 1]} ${t._id.year.toString().slice(-2)}`,
      reported: t.reported,
      resolved: t.resolved,
    }));

    // Preventive effectiveness stats
    const effectivenessStats = await PreventiveAction.aggregate([
      { $match: { effectivenessLevel: { $ne: 'Pending Evaluation' } } },
      { $group: { _id: '$effectivenessLevel', count: { $sum: 1 } } },
    ]);

    // Alerts: Critical issues or low reliability needing manual review
    const criticalAlerts = await Issue.find({
      $or: [
        { 'priority.level': 'Critical', status: { $ne: 'VERIFIED RESOLVED' } },
        { reliabilityLevel: 'Low', status: 'NEW' },
        { recurrenceLevel: 'Very High', status: { $nin: ['ACTION COMPLETED', 'VERIFIED RESOLVED'] } },
      ],
    })
      .select('title category priority recurrenceLevel reliabilityLevel status createdAt location')
      .limit(6)
      .lean();

    // Latest incoming citizen complaints & issues (newest first)
    const recentIssues = await Issue.find()
      .populate('createdBy', 'name email village')
      .populate('assignedWorker', 'name email specialization')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    res.status(200).json({
      success: true,
      kpis: {
        totalIssues,
        pendingIssues,
        inProgressIssues,
        monitoringIssues,
        resolvedIssues,
        reopenedIssues,
        criticalIssues,
        highRecurrenceIssues,
        totalWorkers,
        totalCitizens,
        totalPreventiveActions,
        completedPreventiveActions,
      },
      charts: {
        categories: categoryStats.map((c) => ({ name: c._id, count: c.count })),
        statuses: statusStats.map((s) => ({ name: s._id, count: s.count })),
        priorities: priorityStats.map((p) => ({ name: p._id, count: p.count })),
        recurrenceRisks: recurrenceStats.map((r) => ({ name: r._id, count: r.count })),
        monthlyTrends: formattedTrends,
        effectiveness: effectivenessStats.map((e) => ({ name: e._id, count: e.count })),
      },
      recentIssues,
      alerts: criticalAlerts,
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving analytics' });
  }
};
