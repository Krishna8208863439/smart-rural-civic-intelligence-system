/**
 * PreventiveEffectivenessService
 * Evaluates the empirical reduction in civic complaints following a preventive action.
 * 
 * NOTE: Operational governance indicator measuring historical recurrence delta,
 * not a laboratory causal proof.
 */

class PreventiveEffectivenessService {
  /**
   * Calculate effectiveness metrics
   * @param {Object} params
   * @param {Number} params.beforeFrequency - Number of incidents in observation window before action
   * @param {Number} params.afterFrequency - Number of incidents in equivalent window after action
   * @param {Number} params.daysObserved - Days elapsed since completion
   * @returns {Object} Effectiveness score, level, and reduction %
   */
  static evaluate({
    beforeFrequency = 0,
    afterFrequency = 0,
    daysObserved = 30,
  }) {
    if (beforeFrequency <= 0) {
      return {
        score: 50,
        level: 'Pending Evaluation',
        reductionPercentage: 0,
        summary: 'Baseline frequency prior to preventive intervention was not established.',
      };
    }

    // Calculate reduction percentage
    const reduction = ((beforeFrequency - afterFrequency) / beforeFrequency) * 100;
    const boundedReduction = Math.max(-100, Math.min(100, Math.round(reduction)));

    // Score calculation:
    // If reduction is 100% (0 subsequent reports): Score ~ 95
    // If reduction is 80%: Score ~ 85
    // If reduction is 50%: Score ~ 60
    // If after >= before: Score <= 30
    let score = 50;
    if (boundedReduction >= 80) {
      score = Math.round(85 + (boundedReduction - 80) * 0.75);
    } else if (boundedReduction >= 50) {
      score = Math.round(65 + (boundedReduction - 50) * 0.65);
    } else if (boundedReduction >= 20) {
      score = Math.round(40 + (boundedReduction - 20) * 0.8);
    } else if (boundedReduction > 0) {
      score = Math.round(30 + boundedReduction * 0.5);
    } else {
      score = Math.max(5, 30 + boundedReduction * 0.25);
    }

    score = Math.max(5, Math.min(100, score));

    let level = 'Low';
    if (score >= 81) {
      level = 'Very High';
    } else if (score >= 61) {
      level = 'High';
    } else if (score >= 31) {
      level = 'Moderate';
    } else {
      level = 'Low';
    }

    return {
      score,
      level,
      reductionPercentage: boundedReduction,
      beforeFrequency,
      afterFrequency,
      daysObserved,
      summary: `Complaints dropped from ${beforeFrequency} to ${afterFrequency} post-action (${boundedReduction}% reduction observed over ${daysObserved} days).`,
      disclaimer: 'Operational estimate based on registered reports, not causal scientific proof.',
    };
  }
}

module.exports = PreventiveEffectivenessService;
