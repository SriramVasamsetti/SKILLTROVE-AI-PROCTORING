const Analytics = require('../models/analytics.model');
const User = require('../models/user.model');
const QuizAttempt = require('../models/quizAttempt.model');

function startOfUtcDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function ensureAnalyticsDoc(userId) {
  let doc = await Analytics.findOne({ userId });
  if (!doc) doc = await Analytics.create({ userId, heatmapDaily: [], scores: [], leaderboard: [] });
  return doc;
}

async function bumpHeatmap(userId, at = new Date()) {
  const day = startOfUtcDay(at);
  const doc = await ensureAnalyticsDoc(userId);
  const idx = doc.heatmapDaily.findIndex((h) => startOfUtcDay(h.date).getTime() === day.getTime());
  if (idx === -1) doc.heatmapDaily.push({ date: day, quizzesCompleted: 1 });
  else doc.heatmapDaily[idx].quizzesCompleted += 1;
  await doc.save();
}

async function pushScoreEntry(userId, entry) {
  const doc = await ensureAnalyticsDoc(userId);
  doc.scores.push(entry);
  if (doc.scores.length > 200) doc.scores.splice(0, doc.scores.length - 200);
  await doc.save();
}

async function rebuildLeaderboardRanks(subject = null) {
  const pipeline =
    subject == null
      ? [
          { $match: { completedAt: { $exists: true, $ne: null } } },
          { $group: { _id: '$userId', avgPct: { $avg: { $cond: [{ $eq: ['$maxScore', 0] }, 0, { $divide: ['$totalScore', '$maxScore'] }] } }, attempts: { $sum: 1 } } },
          { $sort: { avgPct: -1 } },
        ]
      : [
          { $lookup: { from: 'quizzes', localField: 'quizId', foreignField: '_id', as: 'q' } },
          { $unwind: '$q' },
          { $match: { completedAt: { $exists: true, $ne: null }, 'q.subject': subject } },
          { $group: { _id: '$userId', avgPct: { $avg: { $cond: [{ $eq: ['$maxScore', 0] }, 0, { $divide: ['$totalScore', '$maxScore'] }] } }, attempts: { $sum: 1 } } },
          { $sort: { avgPct: -1 } },
        ];

  const leaderboard = await QuizAttempt.aggregate(pipeline);
  let rank = 1;
  for (const row of leaderboard) {
    const doc = await ensureAnalyticsDoc(row._id);
    doc.leaderboard.push({ scope: subject ? 'subject' : 'global', subject: subject ?? undefined, rank, totalParticipants: leaderboard.length, at: new Date() });
    if (doc.leaderboard.length > 60) doc.leaderboard.splice(0, doc.leaderboard.length - 60);
    await doc.save();
    rank += 1;
  }
  return leaderboard;
}

async function getHeatmapForUser(userId) {
  const doc = await Analytics.findOne({ userId });
  if (!doc) return [];
  return doc.heatmapDaily.map((h) => ({ date: h.date.toISOString().slice(0, 10), quizzesCompleted: h.quizzesCompleted }));
}

async function leaderboardTop(limit = 20, subject = null) {
  const pipeline =
    subject == null
      ? [
          { $match: { completedAt: { $exists: true, $ne: null } } },
          { $group: { _id: '$userId', avgPct: { $avg: { $cond: [{ $eq: ['$maxScore', 0] }, 0, { $divide: ['$totalScore', '$maxScore'] }] } }, attempts: { $sum: 1 }, lastAttempt: { $max: '$completedAt' } } },
          { $sort: { avgPct: -1 } },
          { $limit: limit },
        ]
      : [
          { $lookup: { from: 'quizzes', localField: 'quizId', foreignField: '_id', as: 'q' } },
          { $unwind: '$q' },
          { $match: { completedAt: { $exists: true, $ne: null }, 'q.subject': subject } },
          { $group: { _id: '$userId', avgPct: { $avg: { $cond: [{ $eq: ['$maxScore', 0] }, 0, { $divide: ['$totalScore', '$maxScore'] }] } }, attempts: { $sum: 1 }, lastAttempt: { $max: '$completedAt' } } },
          { $sort: { avgPct: -1 } },
          { $limit: limit },
        ];

  const rows = await QuizAttempt.aggregate(pipeline);
  const userIds = rows.map((r) => r._id);
  const users = await User.find({ _id: { $in: userIds } }).select('name email role').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return rows.map((r, idx) => ({ rank: idx + 1, avgPct: r.avgPct, attempts: r.attempts, lastAttempt: r.lastAttempt, user: byId.get(String(r._id)) ?? { _id: r._id } }));
}

/**
 * @function getPersonalisedRecommendations
 * @description Analyses weak topics from quiz history and recommends next Bloom level.
 * Future scope: feeds mobile app and AI learning assistant.
 */
async function getPersonalisedRecommendations(userId) {
  const attempts = await QuizAttempt.find({ userId, completedAt: { $exists: true } })
    .sort({ completedAt: -1 })
    .limit(20)
    .lean();

  const topicStats = {};
  for (const attempt of attempts) {
    const subject = attempt.subject || 'General';
    if (!topicStats[subject]) topicStats[subject] = { total: 0, score: 0 };
    topicStats[subject].total += attempt.maxScore || 0;
    topicStats[subject].score += attempt.totalScore || 0;
  }

  const BLOOM_PROGRESSION = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

  const recommendations = Object.entries(topicStats).map(([topic, stat]) => {
    const pct = stat.total > 0 ? stat.score / stat.total : 0;
    const bloomIndex = pct >= 0.8 ? 2 : pct >= 0.6 ? 1 : 0;
    return {
      topic,
      accuracyPct: Math.round(pct * 100),
      recommendedBloomLevel: BLOOM_PROGRESSION[bloomIndex],
      priority: pct < 0.6 ? 'high' : pct < 0.8 ? 'medium' : 'low',
    };
  });

  return recommendations.sort((a, b) =>
    (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) -
    (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2)
  );
}

module.exports = {
  bumpHeatmap,
  pushScoreEntry,
  rebuildLeaderboardRanks,
  getHeatmapForUser,
  leaderboardTop,
  startOfUtcDay,
  getPersonalisedRecommendations,
};
