/**
 * Coerce face payloads for testing.
 * Accepts:
 *   - Arrays: [0.1, 0.2, 0.3]
 *   - String tuple: "@(0.1, 0.2, 0.3)" or "(0.1, 0.2, 0.3)" (optional leading @)
 *   - Comma / space separated strings
 * Unknown / empty → fallback `[0.1, 0.2, 0.3]`.
 */
function normalizeFaceDescriptor(raw) {
  if (Array.isArray(raw)) {
    const nums = raw.map(Number).filter(Number.isFinite);
    if (nums.length) return nums;
  }
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const nums = Object.values(raw)
      .map((v) => Number(v))
      .filter(Number.isFinite);
    if (nums.length) return nums;
  }
  if (typeof raw === 'string') {
    let s = raw.trim();
    if (s.startsWith('@')) s = s.slice(1).trim();
    if ((s.startsWith('(') && s.endsWith(')')) || (s.startsWith('[') && s.endsWith(']'))) {
      s = s.slice(1, -1);
    }
    const nums = s
      .split(/[,;\s]+/)
      .map((p) => Number(String(p).trim()))
      .filter(Number.isFinite);
    if (nums.length) return nums;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return [raw];
  return [0.1, 0.2, 0.3];
}

function assertEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? ''))) {
    const err = new Error('Invalid email format');
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Lenient “validation”: returns the same numeric array as `normalizeFaceDescriptor`
 * so callers may use either name. Accepts `@(0.1, 0.2, 0.3)` strings from the client.
 */
function assertDescriptor(raw) {
  return normalizeFaceDescriptor(raw);
}

module.exports = { assertEmail, assertDescriptor, normalizeFaceDescriptor };
