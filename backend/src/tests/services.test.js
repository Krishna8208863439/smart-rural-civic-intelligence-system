const PriorityService = require('../services/PriorityService');
const EvidenceReliabilityService = require('../services/EvidenceReliabilityService');
const RecurrenceEngine = require('../services/RecurrenceEngine');
const RootCauseService = require('../services/RootCauseService');
const PreventiveRecommendationService = require('../services/PreventiveRecommendationService');
const PreventiveEffectivenessService = require('../services/PreventiveEffectivenessService');

describe('SRCI Intelligence Services Unit Tests', () => {
  // 1. PriorityService
  describe('PriorityService', () => {
    it('should compute Critical priority for critical severity and sensitive location', () => {
      const result = PriorityService.calculate({
        severity: 'Critical',
        reportCount: 5,
        createdAt: new Date(Date.now() - 86400000 * 5),
        landmark: 'Near ZP School and Hospital',
        category: 'Drainage blockage',
        communityConfirms: 4,
      });

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.level).toBe('Critical');
      expect(result.factors.severityWeight).toBe(40);
      expect(result.factors.locationSensitivity).toBe(15);
    });

    it('should compute Low or Medium priority for minor low severity issues', () => {
      const result = PriorityService.calculate({
        severity: 'Low',
        reportCount: 1,
        createdAt: new Date(),
        landmark: 'Open Field Path',
        category: 'Other',
        communityConfirms: 0,
      });

      expect(result.score).toBeLessThanOrEqual(35);
      expect(['Low', 'Medium']).toContain(result.level);
    });
  });

  // 2. EvidenceReliabilityService
  describe('EvidenceReliabilityService', () => {
    it('should evaluate high reliability when multiple photos, valid GPS and community confirms are present', () => {
      const result = EvidenceReliabilityService.evaluate({
        images: [{ url: 'https://example.com/p1.jpg' }, { url: 'https://example.com/p2.jpg' }],
        location: {
          coordinates: [73.8567, 18.5204],
          address: 'Main Chowk Road',
          landmark: 'Shivaji Maharaj Statue',
        },
        description: 'Large pothole in the center of the road causing safety hazard for village commuters.',
        communityConfirms: 3,
        metadata: { hasGpsExif: true },
      });

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(['High', 'Very High']).toContain(result.level);
      expect(result.adaptiveVerificationPath).toBe('auto_validated');
    });

    it('should evaluate low reliability when no photos or vague coordinates provided', () => {
      const result = EvidenceReliabilityService.evaluate({
        images: [],
        location: { coordinates: [0, 0] },
        description: 'Bad',
        communityConfirms: 0,
      });

      expect(result.score).toBeLessThanOrEqual(40);
      expect(['Low', 'Medium']).toContain(result.level);
      expect(['manual_review', 'community_confirmation']).toContain(result.adaptiveVerificationPath);
    });
  });

  // 3. RecurrenceEngine
  describe('RecurrenceEngine', () => {
    it('should calculate accurate haversine distance', () => {
      const coord1 = [73.8567, 18.5204];
      const coord2 = [73.8569, 18.5206];
      const dist = RecurrenceEngine.getDistanceMeters(coord1, coord2);
      expect(dist).toBeGreaterThan(0);
      expect(dist).toBeLessThan(100);
    });

    it('should increase recurrence risk when multiple historical issues exist within 300m', () => {
      const current = {
        category: 'Drainage blockage',
        location: { coordinates: [73.8567, 18.5204] },
        createdAt: new Date(),
      };
      const pastIssues = [
        { _id: '1', category: 'Drainage blockage', location: { coordinates: [73.8568, 18.5205] }, createdAt: new Date(Date.now() - 86400000 * 20) },
        { _id: '2', category: 'Drainage blockage', location: { coordinates: [73.8569, 18.5203] }, createdAt: new Date(Date.now() - 86400000 * 40) },
        { _id: '3', category: 'Drainage blockage', location: { coordinates: [73.8566, 18.5202] }, createdAt: new Date(Date.now() - 86400000 * 60) },
      ];

      const result = RecurrenceEngine.analyze(current, pastIssues);
      expect(result.historicalCount).toBe(3);
      expect(result.recurrenceRisk).toBeGreaterThanOrEqual(60);
      expect(['High', 'Very High']).toContain(result.recurrenceLevel);
    });
  });

  // 4. RootCauseService
  describe('RootCauseService', () => {
    it('should return ranked probable causes for Drainage blockage with confidence percentages', () => {
      const causes = RootCauseService.generate({
        category: 'Drainage blockage',
        frequency: 4,
        seasonalPattern: 'Monsoon precipitation peak',
        recurrenceRisk: 80,
      });

      expect(Array.isArray(causes)).toBe(true);
      expect(causes.length).toBeGreaterThan(0);
      expect(causes[0]).toHaveProperty('cause');
      expect(causes[0]).toHaveProperty('confidence');
      expect(causes[0]).toHaveProperty('observations');
      expect(causes[0].confidence).toBeGreaterThanOrEqual(causes[causes.length - 1].confidence);
    });
  });

  // 5. PreventiveRecommendationService
  describe('PreventiveRecommendationService', () => {
    it('should return actionable recommendations for Waste accumulation', () => {
      const recs = PreventiveRecommendationService.generate({
        category: 'Waste accumulation',
        recurrenceRisk: 85,
        frequency: 6,
      });

      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThanOrEqual(2);
      expect(recs[0]).toHaveProperty('action');
      expect(recs[0]).toHaveProperty('priority');
    });
  });

  // 6. PreventiveEffectivenessService
  describe('PreventiveEffectivenessService', () => {
    it('should calculate Very High effectiveness when complaints drop by >80%', () => {
      const evalResult = PreventiveEffectivenessService.evaluate({
        beforeFrequency: 10,
        afterFrequency: 1,
        daysObserved: 60,
      });

      expect(evalResult.reductionPercentage).toBe(90);
      expect(evalResult.score).toBeGreaterThanOrEqual(80);
      expect(evalResult.level).toBe('Very High');
    });

    it('should handle zero or negative reduction gracefully', () => {
      const evalResult = PreventiveEffectivenessService.evaluate({
        beforeFrequency: 5,
        afterFrequency: 7,
        daysObserved: 30,
      });

      expect(evalResult.reductionPercentage).toBeLessThan(0);
      expect(evalResult.score).toBeLessThanOrEqual(35);
      expect(evalResult.level).toBe('Low');
    });
  });
});
