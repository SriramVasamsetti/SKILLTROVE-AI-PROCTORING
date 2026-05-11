const mongoose = require('mongoose');

const dayCountSchema = new mongoose.Schema(
  {
    /** UTC midnight normalized */
    date: { type: Date, required: true },
    quizzesCompleted: { type: Number, default: 0 },
  },
  { _id: false },
);

const scoreEntrySchema = new mongoose.Schema(
  {
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt' },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    maxScore: Number,
    pct: Number,
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const leaderboardSnapshotSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ['global', 'subject'],
      default: 'global',
    },
    subject: String,
    rank: { type: Number, default: null },
    totalParticipants: Number,
    at: Date,
  },
  { _id: false },
);

/** Per-user rollup for heatmaps, streaks, and cached leaderboard snapshots */
const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    /** Derived “heatmap”: quiz completions per UTC calendar day */
    heatmapDaily: [dayCountSchema],
    scores: [scoreEntrySchema],
    leaderboard: [leaderboardSnapshotSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Analytics', analyticsSchema);
