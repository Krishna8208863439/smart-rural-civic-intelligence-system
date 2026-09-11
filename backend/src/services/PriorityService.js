/**
 * PriorityService
 * Calculates dynamic civic issue priority score (0-100) and priority level.
 */

class PriorityService {
  /**
   * Calculate priority score and level
   * @param {Object} params
   * @param {String} params.severity - 'Low' | 'Medium' | 'High' | 'Critical'
   * @param {Number} params.reportCount - Total number of related reports or duplicate citizen submissions
   * @param {Date|Number} params.createdAt - Creation timestamp or days elapsed
   * @param {String} params.landmark - Address or landmark to check for sensitive locations
   * @param {String} params.category - Civic issue category
   * @param {Number} params.communityConfirms - Citizen confirmations
   * @returns {Object} Priority score, level, and breakdown
   */
  static calculate({
    severity = 'Medium',
    reportCount = 1,
    createdAt = new Date(),
    landmark = '',
    category = 'Other',
    communityConfirms = 0,
  }) {
    let severityWeight = 20;
    switch (severity) {
      case 'Critical':
        severityWeight = 40;
        break;
      case 'High':
        severityWeight = 30;
        break;
      case 'Medium':
        severityWeight = 20;
        break;
      case 'Low':
        severityWeight = 10;
        break;
      default:
        severityWeight = 20;
    }

    // Reports weight: 1 => 5, 2-3 => 15, 4+ => 20
    let reportsWeight = 5;
    if (reportCount >= 4) {
      reportsWeight = 20;
    } else if (reportCount >= 2) {
      reportsWeight = 12;
    }

    // Pending time weight: 2 points per day up to max 15 points
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const pendingWeight = Math.min(15, diffDays * 2);

    // Location sensitivity check (schools, health centers, water source, main chowk/bazaar)
    let locationSensitivity = 0;
    const sensitiveKeywords = [
      'school',
      'shala',
      'vidyalaya',
      'hospital',
      'clinic',
      'arogya',
      'water tank',
      'well',
      'viheer',
      'pani',
      'bazaar',
      'market',
      'bus stand',
      'main chowk',
      'temple',
      'mandir',
      'primary health',
    ];

    const targetText = `${landmark} ${category}`.toLowerCase();
    const matchedKeyword = sensitiveKeywords.find((kw) => targetText.includes(kw));
    if (matchedKeyword) {
      locationSensitivity = 15;
    }

    // Community confirms: +2 pts per confirm up to 10 pts
    const communityWeight = Math.min(10, communityConfirms * 2);

    // Composite Score
    const rawScore = severityWeight + reportsWeight + pendingWeight + locationSensitivity + communityWeight;
    const boundedScore = Math.max(5, Math.min(100, rawScore));

    // Classification
    let level = 'Medium';
    if (boundedScore >= 81) {
      level = 'Critical';
    } else if (boundedScore >= 61) {
      level = 'High';
    } else if (boundedScore >= 31) {
      level = 'Medium';
    } else {
      level = 'Low';
    }

    const explanationParts = [`Severity baseline: ${severity} (+${severityWeight})`];
    if (reportsWeight > 5) explanationParts.push(`Multi-citizen volume (+${reportsWeight})`);
    if (pendingWeight > 0) explanationParts.push(`Pending duration ${diffDays} day(s) (+${pendingWeight})`);
    if (locationSensitivity > 0) explanationParts.push(`Proximity to sensitive hub [${matchedKeyword}] (+${locationSensitivity})`);
    if (communityWeight > 0) explanationParts.push(`Community corroboration (+${communityWeight})`);

    return {
      score: boundedScore,
      level,
      factors: {
        severityWeight,
        reportsWeight,
        pendingWeight,
        locationSensitivity,
        communityWeight,
        explanation: explanationParts.join(', '),
      },
    };
  }
}

module.exports = PriorityService;
