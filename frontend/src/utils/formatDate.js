/**
 * Format date & time explicitly in Indian Standard Time (IST - Asia/Kolkata)
 */

function normalizeToUtcDate(dateString) {
  if (!dateString) return null;
  let s = String(dateString).trim();
  
  // If string has date format YYYY-MM-DD followed by space or T
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s)) {
    s = s.replace(' ', 'T');
    // If no timezone indicator (Z or + or - after time), append Z so browser parses as UTC
    const timePart = s.split('T')[1] || '';
    if (!timePart.endsWith('Z') && !timePart.includes('+') && !timePart.includes('-')) {
      s += 'Z';
    }
  }
  
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = normalizeToUtcDate(dateString);
  if (!date) return String(dateString);

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatShortTime(dateString) {
  if (!dateString) return 'N/A';
  const date = normalizeToUtcDate(dateString);
  if (!date) return String(dateString);

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getLiveIstString() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const date = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return { time, date, full: `${date}, ${time} (IST)` };
}
