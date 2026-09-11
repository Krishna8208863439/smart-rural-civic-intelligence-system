/**
 * Input validation helpers
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validateIssuePayload(data) {
  const errors = [];
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
    errors.push('Description must be at least 5 characters long');
  }
  if (!data.category) {
    errors.push('Category is required');
  }
  if (data.latitude === undefined || data.longitude === undefined) {
    errors.push('GPS coordinates (latitude, longitude) are required');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
