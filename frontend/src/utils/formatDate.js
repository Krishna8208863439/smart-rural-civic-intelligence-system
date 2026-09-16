/**
 * Format date & time explicitly in Indian Standard Time (IST - Asia/Kolkata)
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  let s = String(dateString).trim();
  // Ensure naive UTC strings (without Z or offset) are treated as UTC
  if (s.includes('T') && !s.endsWith('Z') && !s.includes('+') && !s.slice(10).includes('-')) {
    s += 'Z';
  }
  const date = new Date(s);
  if (isNaN(date.getTime())) return String(dateString);

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
  let s = String(dateString).trim();
  if (s.includes('T') && !s.endsWith('Z') && !s.includes('+') && !s.slice(10).includes('-')) {
    s += 'Z';
  }
  const date = new Date(s);
  if (isNaN(date.getTime())) return String(dateString);

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
