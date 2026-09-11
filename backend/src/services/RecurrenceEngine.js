/**
 * RecurrenceEngine
 * Detects chronic recurring civic problem hotspots and evaluates recurrence risk.
 * 
 * NOTE: Data-based operational risk indicator, not a scientifically validated deterministic model.
 */

class RecurrenceEngine {
  /**
   * Calculate distance between two coordinates in meters (Haversine formula)
   */
  static getDistanceMeters(coord1, coord2) {
    if (!coord1 || !coord2) return 999999;
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Analyze recurrence risk for an issue given historical issues
   * @param {Object} currentIssue - The issue being evaluated
   * @param {Array} historicalIssues - Past issues in database
   * @returns {Object} Recurrence risk analysis
   */
  static analyze(currentIssue, historicalIssues = []) {
    const currentCoords = currentIssue.location?.coordinates || [0, 0];
    const category = currentIssue.category;

    // Filter historical issues by same category within 300 meters
    const matchingIssues = historicalIssues.filter((past) => {
      if (String(past._id) === String(currentIssue._id)) return false;
      if (past.category !== category) return false;
      const pastCoords = past.location?.coordinates;
      if (!pastCoords) return false;
      const dist = RecurrenceEngine.getDistanceMeters(currentCoords, pastCoords);
      return dist <= 300;
    });

    const frequency = matchingIssues.length;

    // Calculate intervals between occurrences
    const allDates = [...matchingIssues.map((i) => new Date(i.createdAt)), new Date(currentIssue.createdAt || Date.now())]
      .sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < allDates.length; i++) {
      const diffDays = Math.round((allDates[i] - allDates[i - 1]) / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }

    const avgIntervalDays = intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : 0;

    // Seasonal sensitivity check (monsoon: June - September; summer: March - May)
    const currentMonth = (currentIssue.createdAt ? new Date(currentIssue.createdAt) : new Date()).getMonth(); // 0-indexed
    let seasonalPattern = 'Normal / Non-seasonal';
    let seasonalFactor = 0;

    if (category === 'Drainage blockage' || category === 'Damaged road') {
      // June(5) to Sept(8) is Monsoon in rural India
      if (currentMonth >= 5 && currentMonth <= 8) {
        seasonalPattern = 'Monsoon precipitation peak';
        seasonalFactor = 20;
      }
    } else if (category === 'Water supply' || category === 'Water leakage') {
      // March(2) to May(4) is Summer peak
      if (currentMonth >= 2 && currentMonth <= 4) {
        seasonalPattern = 'Peak summer water stress';
        seasonalFactor = 20;
      }
    } else if (category === 'Waste accumulation') {
      if (frequency >= 3) {
        seasonalPattern = 'Chronic periodic buildup';
        seasonalFactor = 15;
      }
    }

    // Resolution stability calculation
    // If past issues were resolved but reappeared in < 45 days, resolution is fragile
    let fragileResolutions = 0;
    intervals.forEach((intVal) => {
      if (intVal > 0 && intVal <= 45) fragileResolutions++;
    });

    let resolutionStability = 'Stable';
    if (frequency === 0) {
      resolutionStability = 'New incident';
    } else if (fragileResolutions >= 2) {
      resolutionStability = 'Unstable';
    } else if (fragileResolutions === 1) {
      resolutionStability = 'Fragile';
    } else {
      resolutionStability = 'Moderate';
    }

    // Base score from frequency: 0 => 10, 1-2 => 35, 3-5 => 65, 6+ => 85
    let freqScore = 15;
    if (frequency >= 6) {
      freqScore = 80;
    } else if (frequency >= 3) {
      freqScore = 60;
    } else if (frequency >= 1) {
      freqScore = 35;
    }

    // Interval urgency: if average interval is < 40 days, high recurrence pressure
    let intervalScore = 0;
    if (avgIntervalDays > 0 && avgIntervalDays <= 30) {
      intervalScore = 20;
    } else if (avgIntervalDays > 0 && avgIntervalDays <= 60) {
      intervalScore = 10;
    }

    const rawRisk = freqScore + intervalScore + seasonalFactor;
    const recurrenceRisk = Math.max(10, Math.min(100, rawRisk));

    let recurrenceLevel = 'Low';
    if (recurrenceRisk >= 80) {
      recurrenceLevel = 'Very High';
    } else if (recurrenceRisk >= 60) {
      recurrenceLevel = 'High';
    } else if (recurrenceRisk >= 35) {
      recurrenceLevel = 'Medium';
    } else {
      recurrenceLevel = 'Low';
    }

    return {
      recurrenceRisk,
      recurrenceLevel,
      historicalCount: frequency,
      averageIntervalDays: avgIntervalDays,
      seasonalPattern,
      resolutionStability,
      matchingIssueIds: matchingIssues.map((m) => m._id),
      summary: frequency > 0
        ? `${frequency} historical report(s) nearby within 300m. Avg interval: ${avgIntervalDays} days. Pattern: ${seasonalPattern}.`
        : 'First reported incident at this precise locality.',
    };
  }
}

module.exports = RecurrenceEngine;
