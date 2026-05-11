/** Application-wide enums and thresholds */

const ROLES = Object.freeze(['student', 'faculty', 'admin']);

const QUIZ_TYPES = Object.freeze(['MCQ', 'Fill-up', 'Short Ans', 'Coding']);

const BLOOM_LEVELS = Object.freeze([
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
]);

const PROCTOR_EVENT_TYPES = Object.freeze([
  'eye-blink',
  'iris-pattern',
  'eyeball-movement',
  'body-movement',
  'webcam-status',
]);

/** Euclidean (L2) distance threshold — face match when distance ≤ this value */
const DEFAULT_FACE_DISTANCE_THRESHOLD = 0.6;

module.exports = {
  ROLES,
  QUIZ_TYPES,
  BLOOM_LEVELS,
  PROCTOR_EVENT_TYPES,
  DEFAULT_FACE_DISTANCE_THRESHOLD,
};
