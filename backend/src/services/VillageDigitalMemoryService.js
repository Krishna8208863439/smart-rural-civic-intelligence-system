const Issue = require('../models/Issue');
const RecurrenceProfile = require('../models/RecurrenceProfile');
const PreventiveAction = require('../models/PreventiveAction');

/**
 * VillageDigitalMemoryService
 * Maintains and aggregates the long-term operational memory of Gram Panchayat civic infrastructure.
 */

class VillageDigitalMemoryService {
  /**
   * Retrieve aggregated village digital memory records
   */
  static async getMemoryRecords({ category, riskLevel, search, limit = 50 }) {
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (riskLevel && riskLevel !== 'All') query.recurrenceLevel = riskLevel;
    if (search) {
      query['locationPattern.name'] = { $regex: search, $options: 'i' };
    }

    const profiles = await RecurrenceProfile.find(query)
      .sort({ recurrenceRisk: -1, frequency: -1 })
      .limit(limit)
      .lean();

    // Fetch related preventive actions for each hotspot profile
    const enhancedRecords = await Promise.all(
      profiles.map(async (profile) => {
        const actions = await PreventiveAction.find({
          $or: [
            { recurrenceProfileId: profile._id },
            {
              category: profile.category,
              'location.name': { $regex: profile.locationPattern.name, $options: 'i' },
            },
          ],
        })
          .sort({ completedDate: -1, createdAt: -1 })
          .populate('assignedTo', 'name')
          .lean();

        // Calculate average effectiveness of taken actions
        const completedActions = actions.filter((a) => a.effectivenessScore !== null);
        const avgEffectiveness =
          completedActions.length > 0
            ? Math.round(
                completedActions.reduce((acc, cur) => acc + cur.effectivenessScore, 0) /
                  completedActions.length
              )
            : null;

        return {
          ...profile,
          actionsCount: actions.length,
          recentActions: actions.slice(0, 3),
          averageEffectiveness: avgEffectiveness,
          effectivenessLevel:
            avgEffectiveness === null
              ? 'Pending Data'
              : avgEffectiveness >= 80
              ? 'Very High'
              : avgEffectiveness >= 60
              ? 'High'
              : avgEffectiveness >= 30
              ? 'Moderate'
              : 'Low',
        };
      })
    );

    return enhancedRecords;
  }

  /**
   * Get single hotspot memory profile with full history
   */
  static async getHotspotDetail(profileId) {
    const profile = await RecurrenceProfile.findById(profileId)
      .populate({
        path: 'linkedIssueIds',
        select: 'title description status priority severity createdAt resolvedAt images',
      })
      .lean();

    if (!profile) return null;

    const actions = await PreventiveAction.find({
      $or: [
        { recurrenceProfileId: profile._id },
        {
          category: profile.category,
          'location.name': { $regex: profile.locationPattern.name, $options: 'i' },
        },
      ],
    })
      .populate('assignedTo', 'name email specialization')
      .sort({ createdAt: -1 })
      .lean();

    return {
      profile,
      actions,
      history: profile.linkedIssueIds || [],
    };
  }
}

module.exports = VillageDigitalMemoryService;
