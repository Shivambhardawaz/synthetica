const BLOCKED_PATTERNS = [
  /^127\./,/^10\./,/^172\.(1[6-9]|2\d|3[01])\./,/^192\.168\./,
  /^169\.254\./,/^::1$/,/^fc00:/,/^fe80:/,/localhost/i,
  /0\.0\.0\.0/,/metadata\.google/i,/169\.254\.169\.254/
];

function validateURL(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { valid: false, reason: 'Only HTTP/HTTPS allowed' };
    const host = parsed.hostname;
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(host)) return { valid: false, reason: `Blocked host: ${host}` };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

module.exports = { validateURL };
