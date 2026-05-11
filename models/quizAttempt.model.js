const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    type: String,
    /** Raw text/code from client */
    answer: String,
    /** Normalized correctness 0–1 or points earned */
    score: { type: Number, default: 0 },
    maxPoints: Number,
    feedback: String,
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    responses: [answerSchema],
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    /** Integrity / proctoring summary */
    proctoringSessionId: { type: String, index: true },
    flagged: { type: Boolean, default: false },
    reportGeneratedAt: Date,
    completedAt: { type: Date, index: true },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
