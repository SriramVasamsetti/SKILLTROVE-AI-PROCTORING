const mongoose = require('mongoose');
const { PROCTOR_EVENT_TYPES } = require('../config/constants');

const proctorLogSchema = new mongoose.Schema(
  {
    /** Optional link to graded attempt once submitted */
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', index: true },
    sessionId: { type: String, required: true, index: true },
    events: [
      {
        type: {
          type: String,
          enum: PROCTOR_EVENT_TYPES,
          required: true,
        },
        /** Severity 0–1 or category flag */
        value: mongoose.Schema.Types.Mixed,
        message: String,
        metadata: mongoose.Schema.Types.Mixed,
        at: { type: Date, default: Date.now, index: true },
      },
    ],
    webcamAllowed: { type: Boolean, default: true },
  },
  { timestamps: true },
);

proctorLogSchema.index({ sessionId: 1, updatedAt: -1 });

module.exports = mongoose.model('ProctorLog', proctorLogSchema);
