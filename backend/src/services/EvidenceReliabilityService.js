/**
 * EvidenceReliabilityService
 * Evaluates the reliability of reported civic issues and uploaded media evidence.
 * 
 * IMPORTANT DISCLAIMER:
 * This score is an operational risk-management indicator to prioritize verification workflow.
 * It does NOT claim to scientifically prove whether a complaint is true or false.
 */

class EvidenceReliabilityService {
  /**
   * Evaluate evidence reliability for an issue
   * @param {Object} params
   * @param {Array} params.images - Array of uploaded photos
   * @param {Object} params.location - { coordinates: [lng, lat], address, landmark }
   * @param {String} params.description - Text description
   * @param {Array} params.nearbyIssues - Nearby issues found in same category
   * @param {Number} params.communityConfirms - Number of citizen confirmations
   * @param {Object} params.metadata - EXIF / device metadata
   * @returns {Object} Reliability assessment with score, level, factors, and verification path
   */
  static evaluate({
    images = [],
    location = {},
    description = '',
    nearbyIssues = [],
    communityConfirms = 0,
    metadata = {},
  }) {
    let locationScore = 70;
    let timeScore = 85;
    let metadataScore = 60;
    let nearbyScore = 50;
    let communityScore = 50;
    const factorNotes = [];

    // 1. Location Consistency (0-100)
    if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      const [lng, lat] = location.coordinates;
      // Realistic coordinates check (non-zero and valid ranges)
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0)) {
        locationScore = 85;
        if (location.landmark && location.landmark.trim().length > 2) {
          locationScore = Math.min(100, locationScore + 10);
          factorNotes.push('Specific landmark provided enhances location precision');
        }
      } else {
        locationScore = 30;
        factorNotes.push('Coordinates out of range or default');
      }
    } else {
      locationScore = 20;
      factorNotes.push('Missing precise GPS coordinates');
    }

    // 2. Photo / Media Evidence Quality (0-100)
    if (images && images.length > 0) {
      metadataScore = 75;
      if (images.length > 1) {
        metadataScore = Math.min(100, metadataScore + 15);
        factorNotes.push('Multiple photos attached covering different angles');
      }
      if (metadata.hasGpsExif) {
        metadataScore = Math.min(100, metadataScore + 10);
        factorNotes.push('Camera EXIF geotag corroborates submission coordinates');
      }
    } else {
      metadataScore = 30;
      factorNotes.push('No visual photo evidence attached');
    }

    // 3. Description & Time Coherence (0-100)
    if (description && description.trim().length >= 20) {
      timeScore = 90;
    } else if (description && description.trim().length > 5) {
      timeScore = 70;
      factorNotes.push('Brief description provided');
    } else {
      timeScore = 40;
      factorNotes.push('Description is minimal');
    }

    // 4. Proximity & Similarity with nearby reports (0-100)
    if (nearbyIssues && nearbyIssues.length > 0) {
      nearbyScore = Math.min(95, 60 + nearbyIssues.length * 10);
      factorNotes.push(`${nearbyIssues.length} nearby report(s) in same vicinity lend spatial corroboration`);
    } else {
      nearbyScore = 55; // Neutral baseline for isolated initial report
    }

    // 5. Community Confirmation Score (0-100)
    if (communityConfirms > 0) {
      communityScore = Math.min(100, 50 + communityConfirms * 15);
      factorNotes.push(`Confirmed by ${communityConfirms} community member(s)`);
    } else {
      communityScore = 50;
    }

    // Weighted composite calculation:
    // Location: 25%, Photo/Metadata: 30%, Description/Coherence: 15%, Nearby: 15%, Community: 15%
    const totalScore = Math.round(
      locationScore * 0.25 +
      metadataScore * 0.30 +
      timeScore * 0.15 +
      nearbyScore * 0.15 +
      communityScore * 0.15
    );

    const boundedScore = Math.max(0, Math.min(100, totalScore));

    // Classification
    let reliabilityLevel = 'Low';
    let adaptiveVerificationPath = 'manual_review';

    if (boundedScore >= 81) {
      reliabilityLevel = 'Very High';
      adaptiveVerificationPath = 'auto_validated';
    } else if (boundedScore >= 61) {
      reliabilityLevel = 'High';
      adaptiveVerificationPath = 'auto_validated';
    } else if (boundedScore >= 31) {
      reliabilityLevel = 'Medium';
      adaptiveVerificationPath = 'community_confirmation';
    } else {
      reliabilityLevel = 'Low';
      adaptiveVerificationPath = 'manual_review';
    }

    return {
      score: boundedScore,
      level: reliabilityLevel,
      adaptiveVerificationPath,
      factors: {
        locationConsistency: locationScore,
        timeConsistency: timeScore,
        metadataScore,
        nearbySimilarity: nearbyScore,
        communityScore,
        summary: factorNotes.length > 0 ? factorNotes.join('; ') : 'Standard single-source submission',
      },
      disclaimer: 'Operational risk-management metric for verification routing, not proof of truth.',
    };
  }
}

module.exports = EvidenceReliabilityService;
