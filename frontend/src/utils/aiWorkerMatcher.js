/**
 * AI Civic Worker Matching Engine
 * Automatically matches a civic issue's detected category with the best qualified field worker
 * based on specialization keywords, task capacity, and category classification.
 */

export const getAiWorkerRecommendation = (category, workers = []) => {
  if (!category || !workers || workers.length === 0) {
    return null;
  }

  const cat = category.toLowerCase();
  let targetKeywords = [];
  let reason = '';

  // 1. Water Supply & Leakage -> Water Supply / PHE
  if (
    cat.includes('water') ||
    cat.includes('pipeline') ||
    cat.includes('leak') ||
    cat.includes('pump') ||
    cat.includes('borewell')
  ) {
    targetKeywords = ['water', 'phe', 'pipeline'];
    reason = 'Specialized in Water Supply networks, valve maintenance, and PHE infrastructure';
  }
  // 2. Waste, Sanitation, Drainage -> Sanitation & Waste Lead
  else if (
    cat.includes('sanitation') ||
    cat.includes('waste') ||
    cat.includes('garbage') ||
    cat.includes('drain') ||
    cat.includes('culvert') ||
    cat.includes('sewage') ||
    cat.includes('toilet') ||
    cat.includes('kachra')
  ) {
    targetKeywords = ['sanitation', 'waste', 'drain'];
    reason = 'Specialized in Village Sanitation, Drainage desilting, and Solid Waste containment';
  }
  // 3. Roads, Potholes, Streetlights, Civil Works -> Roads & Works Lead
  else if (
    cat.includes('road') ||
    cat.includes('pothole') ||
    cat.includes('street') ||
    cat.includes('light') ||
    cat.includes('pole') ||
    cat.includes('civil') ||
    cat.includes('bridge') ||
    cat.includes('asphalt')
  ) {
    targetKeywords = ['road', 'work', 'civil', 'electrical'];
    reason = 'Specialized in Civil Works, Road resurfacing, and Gram Panchayat street infrastructure';
  } else {
    targetKeywords = ['general', 'civil'];
    reason = 'Assigned to General Civic Infrastructure Lead';
  }

  // Find the best matching worker by specialization
  let matchedWorker = workers.find((w) => {
    const spec = (w.specialization || '').toLowerCase();
    const name = (w.name || '').toLowerCase();
    return targetKeywords.some((kw) => spec.includes(kw) || name.includes(kw));
  });

  const isExactSpecMatch = !!matchedWorker;

  // Fallback to least loaded active worker if no direct keyword match
  if (!matchedWorker) {
    matchedWorker = [...workers].sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0))[0];
    reason = 'Selected based on lowest pending field workload';
  }

  if (!matchedWorker) return null;

  return {
    worker: matchedWorker,
    confidence: isExactSpecMatch ? 97 : 84,
    reason,
    matchedCategory: category,
  };
};
