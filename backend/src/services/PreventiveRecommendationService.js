/**
 * PreventiveRecommendationService
 * Formulates specific, actionable preventive measures tailored to rural civic infrastructure.
 */

class PreventiveRecommendationService {
  /**
   * Recommend preventive actions based on category and recurrence
   * @param {Object} params
   * @param {String} params.category
   * @param {Number} params.recurrenceRisk
   * @param {Number} params.frequency
   * @param {Array} params.probableCauses
   * @returns {Array} List of preventive actions
   */
  static generate({
    category = 'Other',
    recurrenceRisk = 30,
    frequency = 1,
    probableCauses = [],
  }) {
    const recommendations = [];

    switch (category) {
      case 'Waste accumulation':
        recommendations.push({
          action: 'Install 2x 240L twin-compartment masonry bins with weather covers at this intersection',
          priority: recurrenceRisk >= 60 ? 'Urgent' : 'Medium',
          timeframe: 'Within 14 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹12,000',
        });
        recommendations.push({
          action: 'Increase Gram Panchayat sanitation vehicle pickup frequency from weekly to tri-weekly (Mon-Wed-Sat)',
          priority: 'Urgent',
          timeframe: 'Immediate (Next cycle)',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: 'Operational',
        });
        recommendations.push({
          action: 'Erect civic signages prohibiting illegal dumping with ₹500 penalty under Gram Panchayat Bylaws',
          priority: 'Routine',
          timeframe: 'Within 21 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹2,500',
        });
        break;

      case 'Drainage blockage':
        recommendations.push({
          action: 'Execute systematic desilting and deepening of 120-meter open storm drain stretch prior to monsoon',
          priority: 'Urgent',
          timeframe: 'Within 10 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹18,000',
        });
        recommendations.push({
          action: 'Install heavy-duty galvanized wire mesh trash-traps at culvert intake mouth to intercept plastics',
          priority: 'Medium',
          timeframe: 'Within 15 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹6,000',
        });
        recommendations.push({
          action: 'Schedule monthly drain inspection protocol with assigned Gram Panchayat sanitation worker',
          priority: 'Routine',
          timeframe: 'Continuous monthly',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: 'Routine workload',
        });
        break;

      case 'Water leakage':
      case 'Water supply':
        recommendations.push({
          action: 'Replace deteriorated 50-meter PVC pipe segment with high-density polyethylene (HDPE) PN-10 pipe',
          priority: 'Urgent',
          timeframe: 'Within 14 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹24,000',
        });
        recommendations.push({
          action: 'Install 25mm automatic kinetic air release valve at high point to suppress hydraulic water hammer surges',
          priority: 'Medium',
          timeframe: 'Within 20 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹4,500',
        });
        recommendations.push({
          action: 'Audit and regularize domestic connections with standard compression fittings',
          priority: 'Routine',
          timeframe: 'Within 30 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: 'Revenue neutral',
        });
        break;

      case 'Damaged road':
        recommendations.push({
          action: 'Construct roadside masonry drainage ditch to divert standing water before road patch sealing',
          priority: 'Urgent',
          timeframe: 'Within 20 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹35,000',
        });
        recommendations.push({
          action: 'Apply dense bituminous macadam (DBM) base coat followed by 25mm bituminous concrete seal coat',
          priority: 'Medium',
          timeframe: 'Within 30 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹48,000',
        });
        break;

      case 'Streetlight failure':
        recommendations.push({
          action: 'Install 10kA surge protection device (SPD) and 4kV surge-resistant 45W LED drivers',
          priority: 'Urgent',
          timeframe: 'Within 10 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹8,500',
        });
        recommendations.push({
          action: 'Weatherproof all junction boxes with IP65 silicone sealant and upgraded compression glands',
          priority: 'Medium',
          timeframe: 'Within 15 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹3,000',
        });
        break;

      case 'Sanitation':
        recommendations.push({
          action: 'Schedule vacuum suction desludging of community septic chamber and inspection of soakage field',
          priority: 'Urgent',
          timeframe: 'Within 7 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: '₹7,000',
        });
        break;

      default:
        recommendations.push({
          action: 'Conduct joint field inspection with Gram Sevak and ward committee representative',
          priority: 'Medium',
          timeframe: 'Within 14 days',
          suggestedBy: 'PreventiveRecommendationService',
          estimatedBudget: 'Nominal',
        });
        break;
    }

    return recommendations;
  }
}

module.exports = PreventiveRecommendationService;
