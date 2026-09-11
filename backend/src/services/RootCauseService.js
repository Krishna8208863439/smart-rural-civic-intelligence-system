/**
 * RootCauseService
 * Generates ranked probabilistic root cause hypotheses based on category, recurrence, and seasonal metrics.
 * 
 * IMPORTANT:
 * These are hypotheses based on historical trends, NOT scientifically proven facts.
 */

class RootCauseService {
  /**
   * Determine probable root causes
   * @param {Object} params
   * @param {String} params.category - Civic category
   * @param {Number} params.frequency - Historical recurrence count
   * @param {String} params.seasonalPattern - Detected seasonal context
   * @param {Number} params.recurrenceRisk - Evaluated risk score
   * @param {String} params.landmark - Location landmark
   * @returns {Array} List of probable root causes with confidence and observations
   */
  static generate({
    category = 'Other',
    frequency = 1,
    seasonalPattern = '',
    recurrenceRisk = 30,
    landmark = '',
  }) {
    const causes = [];

    switch (category) {
      case 'Drainage blockage':
        if (seasonalPattern.includes('Monsoon')) {
          causes.push({
            cause: 'Inadequate stormwater culvert capacity during monsoon runoff',
            confidence: 84,
            observations: [
              'Culvert cross-section undersized for peak monsoon cloudburst volume',
              'Silt and agricultural runoff sedimentation narrowing channel bed',
            ],
          });
        }
        causes.push({
          cause: 'Solid plastic waste and construction debris obstructing underground conduit',
          confidence: frequency >= 3 ? 78 : 62,
          observations: [
            `${frequency} recurrent blockages reported at this drainage junction`,
            'Open drain design vulnerable to uncollected street trash',
          ],
        });
        causes.push({
          cause: 'Defective slope gradient causing stagnant wastewater backflow',
          confidence: 54,
          observations: [
            'Reverse gradient identified along road shoulder',
            'Water fails to discharge into secondary tributary canal',
          ],
        });
        break;

      case 'Waste accumulation':
        causes.push({
          cause: 'Sub-optimal waste collection frequency relative to daily hamlet output',
          confidence: frequency >= 3 ? 82 : 65,
          observations: [
            'Collection vehicle visits every 5-7 days while threshold is 3 days',
            'High population density near commercial bazaar/chowk',
          ],
        });
        causes.push({
          cause: 'Lack of covered community dustbins within 150m walking radius',
          confidence: 71,
          observations: [
            'Citizens deposit waste at corner plot due to absence of designated bins',
            'Stray cattle and dog scattering',
          ],
        });
        causes.push({
          cause: 'Commercial dumping from nearby local grocery & vegetable vendors',
          confidence: 58,
          observations: [
            'Organic vegetable waste dumps peak on weekly market days',
            'No commercial segregation policy enforced',
          ],
        });
        break;

      case 'Water leakage':
      case 'Water supply':
        causes.push({
          cause: 'Sub-surface pipe aging and joint rupture under vehicular pressure',
          confidence: frequency >= 2 ? 79 : 64,
          observations: [
            'Pipelaying dates back over 8 years with PVC grade Class 2',
            'Tractor and heavy agricultural transport vibration along road',
          ],
        });
        causes.push({
          cause: 'Pressure surge and water hammer during distribution pump start',
          confidence: 68,
          observations: [
            'Absence of air release valves along uphill elevation ridge',
            'Repeated bursts occur within 48 hours of supply cycles',
          ],
        });
        causes.push({
          cause: 'Unauthorized domestic tapping causing joint dislocation',
          confidence: 51,
          observations: [
            'Multiple unofficial connection nipples observed near pipeline',
          ],
        });
        break;

      case 'Damaged road':
        causes.push({
          cause: 'Sub-base soil waterlogging due to lack of roadside drainage',
          confidence: 81,
          observations: [
            'Potholes continuously form where roadside rainwater puddles pool',
            'Asphalt top layer strips off under standing water saturation',
          ],
        });
        causes.push({
          cause: 'Overloaded sugarcane and gravel tractor-trailers exceeding axle limits',
          confidence: 69,
          observations: [
            'Heavy seasonal transport passage during harvest cycles',
            'Sub-grade rutting visible along wheel tracks',
          ],
        });
        break;

      case 'Streetlight failure':
        causes.push({
          cause: 'Voltage fluctuations and phase imbalance in rural feeder line',
          confidence: 76,
          observations: [
            'Surge spikes during tube-well motor start-up hours (evening 6-8 PM)',
            'LED driver capacitor burnout detected in replaced units',
          ],
        });
        causes.push({
          cause: 'Moisture ingress into junction boxes and unshielded cable joints',
          confidence: 63,
          observations: [
            'Open pole junction boxes exposed to rain and morning dew',
            'Thermal expansion loosening terminal screw clamps',
          ],
        });
        break;

      case 'Sanitation':
        causes.push({
          cause: 'Community toilet septic tank soak-pit saturation',
          confidence: 74,
          observations: [
            'High groundwater table preventing subsoil infiltration',
            'Desludging tanker cycle overdue by > 6 months',
          ],
        });
        break;

      default:
        causes.push({
          cause: 'Wear and tear from environmental exposure and lack of preventive maintenance',
          confidence: 60,
          observations: [
            'Standard asset depreciation',
            'Periodic servicing backlog',
          ],
        });
        break;
    }

    // Sort by confidence descending
    return causes.sort((a, b) => b.confidence - a.confidence);
  }
}

module.exports = RootCauseService;
