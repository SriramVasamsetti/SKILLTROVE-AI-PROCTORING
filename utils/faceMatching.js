const { DEFAULT_FACE_DISTANCE_THRESHOLD } = require('../config/constants');

function toVector(descriptor) {
  if (!descriptor) return null;
  if (Array.isArray(descriptor)) return descriptor.map(Number);
  if (descriptor instanceof Float32Array) return Array.from(descriptor);
  if (typeof descriptor === 'string') {
    try {
      const parsed = JSON.parse(descriptor);
      return toVector(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

function euclideanDistance(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Returns true when Euclidean (L2) distance between descriptors is ≤ threshold (default from constants).
 */
function faceMatch(storedDescriptor, probeDescriptor, threshold = DEFAULT_FACE_DISTANCE_THRESHOLD) {
  const stored = toVector(storedDescriptor);
  const probe = toVector(probeDescriptor);
  if (!stored || !probe) return false;
  const dist = euclideanDistance(stored, probe);
  return dist <= threshold;
}

module.exports = { faceMatch, euclideanDistance, toVector };
