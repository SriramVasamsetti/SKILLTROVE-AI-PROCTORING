const { asyncHandler } = require('../middleware/asyncHandler');
const { getHeatmapForUser, leaderboardTop, rebuildLeaderboardRanks } = require('../utils/analyticsAggregator');
const QuizAttempt = require('../models/quizAttempt.model');
const User = require('../models/user.model');
const ProctorLog = require('../models/proctoring.model');

async function myHeatmap(req, res) {
  const rows = await getHeatmapForUser(req.user.userId);

  /** Also compute streak info from QuizAttempt timestamps (real-time view of quiz history) */
  const recent = await QuizAttempt.find({
    userId: req.user.userId,
    completedAt: { $exists: true },
  })
    .sort({ completedAt: -1 })
    .limit(60)
    .select('completedAt totalScore maxScore')
    .lean();

  const byDay = new Map(rows.map((r) => [r.date, r.quizzesCompleted]));
  const derived = {};

  recent.forEach((r) => {
    const day = new Date(r.completedAt).toISOString().slice(0, 10);
    derived[day] = (derived[day] || 0) + 1;
  });

  const mergedDates = Array.from(new Set([...byDay.keys(), ...Object.keys(derived)])).sort();
  const heatmapMerged = mergedDates.map((date) => ({
    date,
    quizzesCompleted: Math.max(byDay.get(date) || 0, derived[date] || 0),
  }));

  res.json({ rollup: rows, realtimeFromAttempts: derived, merged: heatmapMerged });
}

async function leaderboard(req, res) {
  const top = parseInt(req.query.limit, 10);
  const { subject } = req.query;
  const board = await leaderboardTop(Number.isFinite(top) ? top : 20, subject || null);
  res.json(board);
}

async function refreshLeaderboard(req, res) {
  if (!['faculty', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { subject } = req.body;
  const rows = await rebuildLeaderboardRanks(subject ?? null);
  res.json({ updated: rows.length });
}

async function quizHistory(req, res) {
  const items = await QuizAttempt.find({
    userId: req.user.userId,
    completedAt: { $exists: true },
  })
    .sort({ completedAt: -1 })
    .populate('quizId', 'subject')
    .lean();

  res.json(
    items.map((a) => ({
      id: a._id,
      completedAt: a.completedAt,
      totalScore: a.totalScore,
      maxScore: a.maxScore,
      subject: a.quizId?.subject,
      flagged: a.flagged,
    })),
  );
}

async function getFacultyStudentAnalytics(req, res) {
  if (!['faculty', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const users = await User.find({ role: 'student' }).select('name email roll').lean();
  const analytics = await Promise.all(users.map(async (u) => {
    const attempts = await QuizAttempt.find({ userId: u._id }).lean();
    const totalScore = attempts.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
    const maxScore = attempts.reduce((acc, curr) => acc + (curr.maxScore || 0), 0);
    const accuracy = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const proctorLogs = await ProctorLog.find({ userId: u._id }).lean();
    
    // Count events that are strikes (denied access or custom flags)
    const strikeEvents = proctorLogs.flatMap(log => 
      (log.events || []).filter(e => 
        (e.type === 'webcam-status' && (e.value === false || e.value?.allowed === false)) ||
        String(e.message || '').toLowerCase().includes('strike')
      )
    );

    return {
      userId: u._id,
      name: u.name,
      roll: u.roll || 'N/A',
      accuracy,
      strikes: strikeEvents.length,
      strikeHistory: strikeEvents.map(e => ({
        date: e.at,
        message: e.message || 'Proctoring Strike Detected'
      }))
    };
  }));

  res.json(analytics);
}

module.exports = {
  myHeatmap: asyncHandler(myHeatmap),
  leaderboard: asyncHandler(leaderboard),
  refreshLeaderboard: asyncHandler(refreshLeaderboard),
  quizHistory: asyncHandler(quizHistory),
  getFacultyStudentAnalytics: asyncHandler(getFacultyStudentAnalytics),
};
